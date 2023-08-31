/**
 * @file バックグラウンドスクリプト
 * Chrome拡張はコンテンツ、バックグラウンド、フレーム(iframe)の3つのコンテキストで実行されます。
 * バックグラウンドはウェブページの寿命とは別に長期間状態を維持したり、時間がかかる処理を分担します。
 */

import {
  DatabaseAgent,
  EXT_ORIGIN,
  MessageData,
  RuntimeMessageAgent,
  assertNotNull,
  createDatabaseAgent,
  createMessageValidatorManager,
  createRuntimeMessageAgent,
} from "@nyanator/chrome-ext-utils";
import {
  BackgroundToContentMessage,
  ContentToBackgroundMessage,
  MSG_KEY_BC,
  MSG_KEY_CB,
} from "interfaces/content-peer-backtround";

import * as ChatGPTUtils from "./utils/chat-gpt-utils";

// IIFE
initializeBackgroundScript();

async function initializeBackgroundScript(): Promise<void> {
  // ユーザーデータを保存するデータベース
  const databaseAgent = createDatabaseAgent("chatgpt-webdeveloper", "savedata");
  await databaseAgent.open();

  // 通信に利用するトークンやキーを管理するマネージャー
  const validatorManager = await createMessageValidatorManager<MessageData>({
    runtimeId: chrome.runtime.id,
    allowedOrigins: [ChatGPTUtils.ORIGIN, EXT_ORIGIN],
  });

  // コンテキスト間のメッセージ通信を準備(バックグラウンド->コンテンツ)
  const backToContentMessageAgent = (await createRuntimeMessageAgent(
    validatorManager,
  )) as RuntimeMessageAgent<BackgroundToContentMessage>;

  // コンテキスト間のメッセージ通信を準備(コンテンツ->バックグラウンド)
  const contentToBackMessageAgent = (await createRuntimeMessageAgent(
    validatorManager,
  )) as RuntimeMessageAgent<ContentToBackgroundMessage>;

  // コンテキスト間メッセージリスナーを設定(コンテンツ->バックグラウンド)
  contentToBackMessageAgent.runtimeMessageListener(
    async (messageData: ContentToBackgroundMessage) => {
      if (messageData.key === MSG_KEY_CB.ShowHTMLWindowRequest) {
        return showHTMLWindow(messageData);
      }
      if (messageData.key === MSG_KEY_CB.SaveDataRequest) {
        return await saveDatabaseData(messageData, databaseAgent);
      }
      if (messageData.key === MSG_KEY_CB.LoadDataRequest) {
        return await loadDatabaseData(messageData, databaseAgent);
      }
    },
  );

  // URLの変更を監視し、コンテンツスクリプトに通知
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    await notifyURLChanged(tabId, changeInfo, tab, backToContentMessageAgent);
  });
}

/**
 * HTMLWindowを表示します。
 * @param messaegData 受信したメッセージ
 */
function showHTMLWindow(messageData: ContentToBackgroundMessage): void {
  chrome.windows.create({
    url:
      "data:text/html;charset=utf-8," + encodeURIComponent(messageData.message),
    width: 800,
    height: 600,
    type: "panel",
  });
}

/**
 * データベースにデータを保存します。
 * @param messaegData 受信したメッセージ
 * @param databaseAgent データベースオブジェクト
 */
async function saveDatabaseData(
  messageData: ContentToBackgroundMessage,
  databaseAgent: DatabaseAgent,
): Promise<void> {
  if (!messageData.subKey) {
    return;
  }
  await databaseAgent.save(messageData.subKey, messageData.message);
}

/**
 * データベースからデータをロードします。
 * @param messaegData 受信したメッセージ
 * @param databaseAgent データベースオブジェクト
 */
async function loadDatabaseData(
  messageData: ContentToBackgroundMessage,
  databaseAgent: DatabaseAgent,
): Promise<BackgroundToContentMessage> {
  const subKey = assertNotNull(messageData.subKey);
  const result = ((await databaseAgent.get(subKey)) ?? "") as string;

  return {
    runtimeId: chrome.runtime.id,
    message: result,
    key: MSG_KEY_BC.ReplyLoadedData,
    subKey: messageData.subKey,
  };
}

/**
 * URLが変更されたことを別のコンテキストに通知します。
 * @param tabId タブを識別するID
 * @param cahgeInfo タブの変更に関する詳細情報
 * @param tab タブオブジェクト
 * @param backToContentMessageAgent コンテンツスクリプトに通知するagent
 */
async function notifyURLChanged(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab,
  backToContentMessageAgent: RuntimeMessageAgent<BackgroundToContentMessage>,
): Promise<void> {
  if (!tab.active || !changeInfo.url) {
    return;
  }

  const tabOrigin = new URL(changeInfo.url).origin;
  if (tabOrigin !== ChatGPTUtils.ORIGIN) {
    return;
  }

  await backToContentMessageAgent.sendRuntimeMessage(
    {
      runtimeId: chrome.runtime.id,
      message: "",
      key: MSG_KEY_BC.UrlUpdatedEvent,
    },
    tabId,
  );
}

import {
  DatabaseAgent,
  MessageAgent,
  MessageDataObject,
  assertNotNull,
} from "@nyanator/chrome-ext-utils";

import { BackgroundScript } from "../interfaces";
import * as ChatGPTUtils from "../utils/chat-gpt-utils";
import { KindMessageDataObject, MSG_KIND } from "../utils/message-def";

/**
 * ChatGPT WebDeveloperのバックグランドスクリプトです。
 */
export class ChatGPTWebDeveloperBackgroundScript implements BackgroundScript {
  /**
   * ChatGPTWebDeveloperBackgroundScript クラスのインスタンスを初期化します。
   * @param databaseAgent 永続化データベースオブジェクト
   * @param messageAgent コンテキスト間メッセージ通信オブジェクト
   */
  constructor(
    private readonly databaseAgent: DatabaseAgent,
    private readonly messageAgent: MessageAgent<KindMessageDataObject>,
  ) {}

  /**
   * 初期化処理。
   */
  async initialize(): Promise<void> {
    this.addEventListeners();
  }

  /**
   * イベントリスナーを設定します。
   */
  private addEventListeners() {
    // コンテキスト間メッセージリスナーを設定
    this.messageAgent.runtimeMessageListener(async (messageData) => {
      if (messageData.kind === MSG_KIND.ShowHTMLWindow) {
        return this.showHTMLWindow(messageData);
      }

      if (messageData.kind === MSG_KIND.Save) {
        return await this.saveDatabase(messageData);
      }

      if (messageData.kind === MSG_KIND.Load) {
        return await this.loadDatabaseData(messageData);
      }
    });

    // URLの変更を監視し、他のコンテキストに通知
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      await this.notifyURLChange(tabId, changeInfo, tab);
    });
  }

  /**
   * HTMLWindowを表示します。
   * @param messaegData 受信したメッセージ
   */
  private showHTMLWindow(messageData: MessageDataObject): void {
    chrome.windows.create({
      url:
        "data:text/html;charset=utf-8," +
        encodeURIComponent(messageData.message),
      width: 800,
      height: 600,
      type: "panel",
    });
  }

  /**
   * データベースにデータを保存します。
   * @param messaegData 受信したメッセージ
   */
  private async saveDatabase(
    messageData: KindMessageDataObject,
  ): Promise<void> {
    if (!messageData.subKind) {
      return;
    }
    await this.databaseAgent.save(messageData.subKind, messageData.message);
  }

  /**
   * データベースからデータをロードします。
   * @param messaegData 受信したメッセージ
   */
  private async loadDatabaseData(
    messageData: KindMessageDataObject,
  ): Promise<KindMessageDataObject> {
    const subKind = assertNotNull(messageData.subKind);
    const result = await this.databaseAgent.get(subKind);
    /* istanbul ignore next */
    if (typeof result !== "string") {
      throw new TypeError();
    }

    return {
      runtimeId: chrome.runtime.id,
      message: result,
      kind: messageData.kind,
      subKind: messageData.subKind,
    };
  }

  /**
   * URLが変更されたことを別のコンテキストに通知します。
   * @param tabId タブを識別するID
   * @param cahgeInfo タブの変更に関する詳細情報
   * @param tab タブオブジェクト
   */
  private async notifyURLChange(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab,
  ): Promise<void> {
    if (!tab.active || !changeInfo.url) {
      return;
    }

    const tabOrigin = new URL(changeInfo.url).origin;
    if (tabOrigin !== ChatGPTUtils.ORIGIN) {
      return;
    }

    await this.messageAgent.sendRuntimeMessage(
      {
        runtimeId: chrome.runtime.id,
        message: "",
        kind: MSG_KIND.UrlUpdated,
        subKind: undefined,
      },
      tabId,
    );
  }
}

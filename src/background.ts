/**
 * @file バックグラウンドスクリプト
 * Chrome拡張はコンテンツ、バックグラウンド、フレーム(iframe)の3つのコンテキストで実行されます。
 * バックグラウンドはウェブページの寿命とは別に長期間状態を維持したり、時間がかかる処理を分担します。
 */
import {
  EXT_ORIGIN,
  createDatabaseAgent,
  createMessageAgent,
} from "@nyanator/chrome-ext-utils";

import { ChatGPTWebDeveloperBackgroundScript } from "./script-class/chatgpt-webdeveloper-background-script";
import * as ChatGPTUtils from "./utils/chat-gpt-utils";
import { KindMessageDataObject } from "./utils/message-def";

// IIFE
(async () => {
  // ユーザーデータを保存するデータベースを準備
  const databaseAgent = createDatabaseAgent("chatgpt-webdeveloper", "savedata");
  await databaseAgent.open();

  // コンテキスト間のメッセージ通信を準備
  const messageAgent = await createMessageAgent<KindMessageDataObject>({
    runtimeId: chrome.runtime.id,
    allowedOrigins: [ChatGPTUtils.ORIGIN, EXT_ORIGIN],
  });

  // バックグランドスクリプトを準備
  const chatGPTWebDeveloperBackgroundScript =
    new ChatGPTWebDeveloperBackgroundScript(databaseAgent, messageAgent);
  await chatGPTWebDeveloperBackgroundScript.initialize();
})();

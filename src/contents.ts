/**
 * @file コンテンツスクリプト
 * Chrome拡張はコンテンツ、バッググラウンド、フレーム(iframe)の3つのコンテキストで実行されます。
 * DOMへのアクセスはウェブページに挿入されるコンテンツスクリプトが担います。
 */
import {
  EXT_ORIGIN,
  appendElementToHead,
  createMessageAgent,
  htmlTextToHtmlElement,
  loadResourceText,
  reserveLoadedAction,
} from "@nyanator/chrome-ext-utils";
import { KindMessageDataObject } from "utils/message-def";

import * as EditorElementCreater from "./editor/editor-element-creater";
import "./preview/html-preview.js";
import * as ChatGPTUtils from "./utils/chat-gpt-utils";

// IIFE
(async () => {
  // コンテキスト間でのメッセージ通信を準備
  const messageAgent = await createMessageAgent<KindMessageDataObject>({
    runtimeId: chrome.runtime.id,
    allowedOrigins: [ChatGPTUtils.ORIGIN, EXT_ORIGIN],
  });

  // Chrome 拡張機能の読み込み完了後の処理
  reserveLoadedAction(document, async () => {
    // Chat GPTのウェブサイトにhtmlからスタイルやリンクを挿入
    const htmlStylesText = await loadResourceText("chat-gpt-styles.html");

    const htmlStyles = htmlTextToHtmlElement(htmlStylesText);
    htmlStyles.querySelectorAll("link")?.forEach((link) => {
      appendElementToHead(document.documentElement, link);
    });

    htmlStyles.querySelectorAll("style")?.forEach((style) => {
      appendElementToHead(document.documentElement, style);
    });

    // エディターを挿入
    const editorElement = await EditorElementCreater.createEditorElement(
      document.documentElement,
      messageAgent,
    );
    document.body.appendChild(editorElement.wrapDiv);
  });
})();

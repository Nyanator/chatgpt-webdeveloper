/**
 * @file コンテンツスクリプト
 * Chrome拡張はコンテンツ、バッググラウンド、フレーム(iframe)の3つのコンテキストで実行されます。
 * DOMへのアクセスはウェブページに挿入されるコンテンツスクリプトが担います。
 */
import {
  EXT_ORIGIN,
  MessageData,
  WindowMessageAgent,
  appendElementToHead,
  createCrossDispatcher,
  createMessageValidatorManager,
  createWindowMessageAgent,
  htmlTextToHtmlElement,
  loadResourceText,
  reserveLoadedAction,
} from "@nyanator/chrome-ext-utils";
import { createEditorElement } from "editor/editor-element";

import { ContentScriptChannel } from "interfaces/content-peer-content";
import {
  ContentToEditorMessage,
  EditorToContentMessage,
} from "./interfaces/content-peer-editor";
import "./preview/html-preview";
import * as ChatGPTUtils from "./utils/chat-gpt-utils";

// Chrome 拡張機能の読み込み完了後の処理
reserveLoadedAction(document, async () => {
  initializeContentScript();
});

async function initializeContentScript(): Promise<void> {
  // Chat GPTのウェブサイトにhtmlファイルからスタイルやリンクを挿入
  appendLinkAndStyles();

  // 通信に利用するトークンやキーを管理するマネージャー
  const validatorManager = await createMessageValidatorManager<MessageData>({
    runtimeId: chrome.runtime.id,
    allowedOrigins: [ChatGPTUtils.ORIGIN, EXT_ORIGIN],
  });

  // コンテキスト間のメッセージ通信を準備(コンテンツ->エディター)
  const contentToEditorMessageAgent = (await createWindowMessageAgent(
    validatorManager,
  )) as WindowMessageAgent<ContentToEditorMessage>;

  // コンテキスト間のメッセージ通信を準備(エディター->コンテンツ)
  const editorToContentMessageAgent = (await createWindowMessageAgent(
    validatorManager,
  )) as WindowMessageAgent<EditorToContentMessage>;

  // 同一コンテキスト内でのメッセージチャンネル
  const crossDispathcer = createCrossDispatcher<ContentScriptChannel>();

  const editorElements = await createEditorElement(document.body);
}

/**
 * Chat GPTのウェブサイトにhtmlファイルからスタイルやリンクを挿入
 */
async function appendLinkAndStyles(): Promise<void> {
  const htmlStylesText = await loadResourceText("chat-gpt-styles.html");

  const htmlStyles = htmlTextToHtmlElement(htmlStylesText);
  htmlStyles.querySelectorAll("link")?.forEach((link) => {
    appendElementToHead(document.documentElement, link);
  });

  htmlStyles.querySelectorAll("style")?.forEach((style) => {
    appendElementToHead(document.documentElement, style);
  });
}

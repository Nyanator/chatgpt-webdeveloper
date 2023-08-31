import {
  EXT_ORIGIN,
  MessageAgent,
  TypedChannelMap,
  appendElementToHead,
  assertNotNull,
  findParentPreElement,
  htmlTextToHtmlElement,
  loadResourceText,
  reserveLoadedAction,
} from "@nyanator/chrome-ext-utils";

import { EditorElements, createEditorElement } from "../editor/editor-element";
import {
  KindMessageData,
  MSG_KIND,
  MSG_SUBKIND,
  PREFIEXED_LANGUAGE,
} from "../utils/message-def";

export interface ContentsScriptChannelMap extends TypedChannelMap {
  channel1: {
    readonly data: number;
    readonly response: number;
  };
}

/**
 * ChatGPT WebDeveloperのコンテンツスクリプトです。
 */
export class ChatGPTWebDeveloperContentScript {
  private editorElements: EditorElements | undefined;

  /**
   * ChatGPTWebDeveloperBackgroundScript クラスのインスタンスを初期化します。
   * @param messageAgent コンテキスト間メッセージ通信オブジェクト
   */
  constructor(private readonly messageAgent: MessageAgent<KindMessageData>) {}

  /**
   * 初期化処理。
   */
  async initialize(): Promise<void> {
    // Chrome 拡張機能の読み込み完了後の処理
    reserveLoadedAction(document, async () => {
      // スタイル設定
      await this.appendLinkAndStyles();

      // エディターの作成
      this.editorElements = await createEditorElement(
        document.body,
        this.messageAgent,
      );
    });
  }

  /**
   * Chat GPTのウェブサイトにhtmlからスタイルやリンクを挿入
   */
  private async appendLinkAndStyles(): Promise<void> {
    const htmlStylesText = await loadResourceText("chat-gpt-styles.html");

    const htmlStyles = htmlTextToHtmlElement(htmlStylesText);
    htmlStyles.querySelectorAll("link")?.forEach((link) => {
      appendElementToHead(document.documentElement, link);
    });

    htmlStyles.querySelectorAll("style")?.forEach((style) => {
      appendElementToHead(document.documentElement, style);
    });
  }

  /**
   * リスナーを設定します。
   */
  private setupListeners() {
    // alt + clickでエディタータブにコードを送信
    document.addEventListener("click", async (event) => {
      if (!(event.target instanceof HTMLElement) || !event.altKey) {
        return;
      }

      if (!this.editorElements?.editor) {
        return;
      }

      const editor = assertNotNull(this.editorElements?.editor);
      const target = event.target;
      await this.postCodeToTab(PREFIEXED_LANGUAGE.HTML, target, editor);
      await this.postCodeToTab(PREFIEXED_LANGUAGE.CSS, target, editor);
      await this.postCodeToTab(PREFIEXED_LANGUAGE.JS, target, editor);
    });
  }
}

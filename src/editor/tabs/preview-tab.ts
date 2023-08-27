import {
  MessageAgent,
  appendScriptText,
  appendStyleTextToHead,
  htmlTextToHtmlElement,
} from "@nyanator/chrome-ext-utils";

import * as ChatGPTUtils from "../../utils/chat-gpt-utils";
import {
  KindMessageDataObject,
  MSG_KIND,
  MSG_SUBKIND,
} from "../../utils/message-def";

import { MonacoEditorTab } from "./monaco-editor-tab";
import { Tab } from "./tab";

/**
 * プレビュータブの実装クラスです。
 *
 */
export class PreviewTab extends Tab {
  /**
   * PreviewTab インスタンスを生成します。
   * @param tabElement タブの HTML 要素
   * @param contentElement タブのコンテンツの HTML 要素
   * @param htmlTab HTML エディタータブのインスタンス、または null
   * @param javaScriptTab JavaScript エディタータブのインスタンス、または null
   * @param cssTab CSS エディタータブのインスタンス、または null
   * @param messageAgent メッセージ送受信を管理する MessageAgent インスタンス
   */
  constructor(
    protected readonly tabElement: HTMLElement,
    protected readonly contentElement: HTMLElement,
    private readonly htmlTab: MonacoEditorTab | null,
    private readonly javaScriptTab: MonacoEditorTab | null,
    private readonly cssTab: MonacoEditorTab | null,
    protected readonly messageAgent: MessageAgent<KindMessageDataObject>,
  ) {
    super(tabElement, contentElement, messageAgent);
  }

  /**
   * プレビュータブの現在のコードを取得します。
   * @returns プレビュータブの現在のコード
   */
  getValue(): string {
    const html = this.htmlTab?.getValue() ?? "";
    const javaScript = this.javaScriptTab?.getValue() ?? "";
    const css = this.cssTab?.getValue() ?? "";

    const htmlElement = htmlTextToHtmlElement(html);
    appendStyleTextToHead(htmlElement, css);
    // スクリプトは末尾に配置される
    appendScriptText(htmlElement, javaScript);
    return htmlElement.outerHTML;
  }

  /**
   * プレビュータブのコードを設定します。
   * @param value 設定するコード
   */
  setValue(value: string) {
    const htmlElement = htmlTextToHtmlElement(value);
    this.htmlTab?.setValue(htmlElement.outerHTML);
    this.javaScriptTab?.setValue("");
    this.cssTab?.setValue("");
  }

  /**
   * プレビュータブがアクティブ化されたときの処理をします。
   */
  async activate() {
    super.activate();
    const previewHTML = this.getValue();
    await this.messageAgent.postWindowMessage(
      window.parent,
      ChatGPTUtils.ORIGIN,
      {
        runtimeId: chrome.runtime.id,
        message: previewHTML,
        kind: MSG_KIND.TabChanged,
        subKind: MSG_SUBKIND.PREVIEW,
      },
    );
  }
}

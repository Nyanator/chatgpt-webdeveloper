import {
  AlertNamedError,
  WindowMessageAgent,
  appendScriptText,
  appendStyleTextToHead,
  htmlTextToHtmlElement,
} from "@nyanator/chrome-ext-utils";

import * as ChatGPTUtils from "../../utils/chat-gpt-utils";
import { MSG_CHANNEL, PREFIEXED_LANGUAGE } from "../../utils/msg-def";

import { MonacoEditorTab } from "./monaco-editor-tab";
import { Tab } from "./tab";

/**
 * プレビュータブの実装クラスです。
 *
 */
export class PreviewTab extends Tab {
  constructor(
    protected readonly tabElement: HTMLElement,
    protected readonly contentElement: HTMLElement,
    private readonly htmlTab: MonacoEditorTab | null,
    private readonly javaScriptTab: MonacoEditorTab | null,
    private readonly cssTab: MonacoEditorTab | null,
    protected readonly messageAgent: WindowMessageAgent,
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
  setValue(value: string): void {
    const htmlElement = htmlTextToHtmlElement(value);
    this.htmlTab?.setValue(htmlElement.outerHTML);
    this.javaScriptTab?.setValue("");
    this.cssTab?.setValue("");
  }

  /**
   * プレビュータブがアクティブ化されたときの処理をします。
   */
  async activate(): Promise<void> {
    super.activate();
    const previewHTML = this.getValue();

    try {
      await this.messageAgent.postMessage(window.parent, ChatGPTUtils.ORIGIN, MSG_CHANNEL.TabChangedEvent, {
        key: PREFIEXED_LANGUAGE.PREVIEW,
        message: previewHTML,
      });
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.TabChangedEvent, error);
    }
  }
}

import {
  AlertNamedError,
  EXT_ORIGIN,
  ElementMap,
  MessageData,
  RuntimeMessageAgent,
  WindowMessageAgent,
  assertNotNull,
  htmlTextToHtmlElement,
  loadResourceText,
} from "@nyanator/chrome-ext-utils";
import { inject, injectable } from "tsyringe";

import * as ChatGPTUtils from "./utils/chat-gpt-utils";
import { extractLanguageClass } from "./utils/chat-gpt-utils";
import * as InteractJsUtils from "./utils/interactjs-utils";
import { LANGUAGE_PREFIX, MSG_CHANNEL, PREFIEXED_LANGUAGE } from "./utils/msg-def";

// prettier-ignore
export const EditorElementsMap = {
  wrap:           { id: "#editor-wrap",             elementType: HTMLDivElement },
  header:         { id: "#editor-header",           elementType: HTMLDivElement },
  loading:        { id: "#editor-loading",          elementType: HTMLDivElement },
  editor:         { id: "#editor-frame",            elementType: HTMLIFrameElement },
  preview:        { id: "#preview-frame",           elementType: HTMLIFrameElement },
  copyCodeButton: { id: "#editor-copy-code",        elementType: HTMLButtonElement },
  copyPath:       { id: "#editor-copy-path",        elementType: SVGPathElement },
  copyRect:       { id: "#editor-copy-rect",        elementType: SVGRectElement },
  copyPolyline:   { id: "#editor-copy-polyline",    elementType: SVGPolylineElement, },
  copyTextBefore: { id: "#editor-copy-text-before", elementType: HTMLSpanElement, },
  copyTextAfter:  { id: "#editor-copy-text-after",  elementType: HTMLSpanElement, },
};
export type EditorElementsType = typeof EditorElementsMap;

@injectable()
export class EditorElement {
  constructor(
    @inject("EditorElementsMap") readonly elements: ElementMap<typeof EditorElementsMap>,
    @inject("RuntimeMessageAgent") readonly runtimeMessageAgent: RuntimeMessageAgent,
    @inject("WindowMessageAgent") readonly windowMessageAgent: WindowMessageAgent,
  ) {
    this.intaractionSetting();
  }

  /**
   * 初期化処理。
   * @param codeEditorTabPath コードエディタータブのパス
   */
  initialize(codeEditorTabPath: string): void {
    this.elements.editor.addEventListener("load", () => this.editorLoaded(codeEditorTabPath));
    this.windowMessageAgent.addListener(MSG_CHANNEL.TabChangedEvent, this.changeTab.bind(this));
    this.windowMessageAgent.addListener(MSG_CHANNEL.ClipboardSave, this.saveClipboard.bind(this));
    this.windowMessageAgent.addListener(MSG_CHANNEL.DatabaseSave, this.saveEditorData.bind(this));

    this.elements.header.addEventListener("dblclick", this.toggleEditor.bind(this));
    this.elements.copyCodeButton.addEventListener("click", this.postClipboardRequest.bind(this));

    document.addEventListener("click", this.postTabUpdateRequest.bind(this));
  }

  /**
   * エディターロード時処理。
   * @param codeEditorTabPath コードエディタータブのパス
   */
  async editorLoaded(codeEditorTabPath: string): Promise<void> {
    // コードエディターの言語の数を取得したいがiframe側にありセキュリティ上要素が見れない
    const htmlText = await loadResourceText(codeEditorTabPath);
    const codeEditorTab = htmlTextToHtmlElement(htmlText);

    codeEditorTab.querySelectorAll(`[class*="${LANGUAGE_PREFIX}"]`)?.forEach(async (tab) => {
      const languageClass = extractLanguageClass(tab);
      if (languageClass === PREFIEXED_LANGUAGE.PREVIEW) {
        return;
      }

      // バックグラウンドにデータのロードを要求
      let loadData;
      try {
        loadData = await this.runtimeMessageAgent.sendMessage(MSG_CHANNEL.DatabaseLoad, {
          key: languageClass,
        });
      } catch (error) {
        throw new AlertNamedError(MSG_CHANNEL.DatabaseLoad, error);
      }

      if (!loadData) {
        return;
      }

      // ロードしたデータをエディターに送信
      try {
        const targetWindow = assertNotNull(this.elements.editor.contentWindow);
        await this.windowMessageAgent.postMessage(targetWindow, EXT_ORIGIN, MSG_CHANNEL.DatabaseLoad, {
          key: loadData.key,
          message: loadData.message,
        });
      } catch (error) {
        throw new AlertNamedError(MSG_CHANNEL.DatabaseLoad, error);
      }
    });
    this.elements.loading.remove();
  }

  /**
   * タブ変更時処理
   * @param messageData プレビュータブのときのhtmlの内容
   */
  changeTab(messageData: MessageData): void {
    const isPreview = messageData.key === PREFIEXED_LANGUAGE.PREVIEW;

    // z-indexでタブを表現
    if (isPreview) {
      const outerHTML = messageData?.message ?? "";
      this.elements.preview.srcdoc = outerHTML;
      this.elements.editor.style.transition = "z-index 0.3s ease";
      this.elements.preview.style.transition = "z-index 0.3s ease";

      this.elements.editor.style.zIndex = "0";
      this.elements.preview.style.zIndex = "10";
      this.elements.preview.style.opacity = "1";
      this.elements.preview.focus();
    } else {
      this.elements.editor.style.zIndex = "10";
      this.elements.preview.style.zIndex = "0";
      this.elements.preview.style.opacity = "0";
    }
  }

  /**
   * バックグランドにエディターのデータを保存します。
   * @param MessageData 書き込むメッセージ
   */
  async saveEditorData(messageData: MessageData): Promise<void> {
    // バックグラウンドにデータの保存を要求
    try {
      await this.runtimeMessageAgent.sendMessage(MSG_CHANNEL.DatabaseSave, {
        key: messageData.key,
        message: messageData.message,
      });
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.DatabaseSave, error);
    }
  }

  /**
   * クリップボードにテキストを書き込みます。
   * @param MessageData 書き込むメッセージ
   */
  async saveClipboard(messageData: MessageData): Promise<void> {
    try {
      await navigator.clipboard.writeText(messageData?.message ?? "");
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.ClipboardSave, error);
    }
  }

  /** エディターを開閉します。 */
  toggleEditor(): void {
    if (this.elements.editor.style.display === "none") {
      this.elements.editor.style.display = "block";
      this.elements.preview.style.display = "block";
      return;
    }

    this.elements.editor.style.display = "none";
    this.elements.preview.style.display = "none";
  }

  /** エディターフレームにクリップボード用のデータ取得を要求 */
  async postClipboardRequest(): Promise<void> {
    this.toggleAnimation(true);
    setTimeout(() => this.toggleAnimation(false), 2000);

    try {
      const targetWindow = assertNotNull(this.elements.editor.contentWindow);
      await this.windowMessageAgent.postMessage(targetWindow, EXT_ORIGIN, MSG_CHANNEL.ClipboardSave);
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.ClipboardSave, error);
    }
  }

  /**
   * エディターフレームにタブ更新を要求します。
   * @param event MouseEvent
   */
  async postTabUpdateRequest(event: MouseEvent): Promise<void> {
    const codeElement = ChatGPTUtils.findCodeElementFromClickElement(event);
    if (!codeElement) {
      return;
    }

    const languageClass = ChatGPTUtils.extractLanguageClass(codeElement);
    if (!languageClass) {
      return;
    }

    try {
      const targetWindow = assertNotNull(this.elements.editor.contentWindow);
      await this.windowMessageAgent.postMessage(targetWindow, EXT_ORIGIN, MSG_CHANNEL.TabUpdate, {
        key: languageClass,
        message: codeElement.textContent ?? "",
      });
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.TabUpdate, error);
    }
  }

  /**
   * Copy Codeボタンのアニメーション効果
   * @param activate コピー中=true,コピー完了false
   */
  toggleAnimation(activate: boolean): void {
    const style = (elem: SVGPathElement | HTMLSpanElement, value: string) => (elem.style.display = value);

    const displayValues = activate
      ? ["none", "none", "inline", "none", "inline"]
      : ["inline", "inline", "none", "inline", "none"];

    [
      this.elements.copyPath,
      this.elements.copyRect,
      this.elements.copyPolyline,
      this.elements.copyTextBefore,
      this.elements.copyTextAfter,
    ].forEach((elem, index) => {
      style(elem, displayValues[index]);
    });
  }

  /** エディターのドラッグ、リサイズ設定。*/
  intaractionSetting(): void {
    // ドラッグ、リサイズ中にmonaco editorが反応しないように設定
    const pointerDisable = () => {
      this.elements.editor.style.pointerEvents = "none";
      this.elements.preview.style.pointerEvents = "none";
    };

    const pointerEnable = () => {
      this.elements.editor.style.pointerEvents = "auto";
      this.elements.preview.style.pointerEvents = "auto";
    };

    InteractJsUtils.draggableSetting(this.elements.header, this.elements.wrap, pointerDisable, pointerEnable);
    InteractJsUtils.resizableSetting(this.elements.wrap, pointerDisable, pointerEnable);
  }
}

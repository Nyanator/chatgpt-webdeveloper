import {
  EXT_ORIGIN,
  MessageAgent,
  appendStyleTextToHead,
  assertNotNull,
  findParentPreElement,
  htmlTextToHtmlElement,
  loadResourceText,
} from "@nyanator/chrome-ext-utils";

import * as InteractJsUtils from "../utils/interactjs-utils";
import {
  KindMessageDataObject,
  MSG_KIND,
  MSG_SUBKIND,
  PREFIEXED_LANGUAGE,
} from "../utils/message-def";

import { CopyCodeButtonElement } from "./copy-code-button.js";

/**
 * エディターを生成し、インスタンスを返します。
 * @param documentElement エディターを配置する HTML 要素
 * @param messageAgent メッセージ送受信を管理する MessageAgent インスタンス
 * @returns HTMLEditorElement インスタンスのプロミス
 */
export const createEditorElement = async (
  documentElement: HTMLElement,
  messageAgent: MessageAgent<KindMessageDataObject>,
): Promise<HTMLEditorElement> => {
  // CSS を読み込み、スタイルを適用
  const cssText = await loadResourceText("editor-element.css");
  appendStyleTextToHead(documentElement, cssText);

  // エディターの HTML を読み込み、要素を生成
  const editorHTMLText = await loadResourceText("editor-element.html");
  const htmlElement = htmlTextToHtmlElement(editorHTMLText);

  // HTMLEditorElement インスタンスを生成して返す
  const htmlEditorElement = new HTMLEditorElement(htmlElement, messageAgent);
  return htmlEditorElement;
};

/**
 * エディターを扱いやすくするためにラップしたクラスです。
 */
class HTMLEditorElement {
  readonly wrapDiv: HTMLDivElement;
  readonly header: HTMLDivElement;
  readonly loadingDiv: HTMLDivElement;
  readonly editorFrame: HTMLIFrameElement;
  readonly previewFrame: HTMLIFrameElement;
  readonly copyCodeButton: CopyCodeButtonElement;
  private readonly messageAgent: MessageAgent<KindMessageDataObject>;

  /**
   * HTMLEditorElement インスタンスを生成します。
   * @param htmlElement エディターの HTML 要素
   * @param messageAgent メッセージ送受信を管理する MessageAgent インスタンス
   */
  constructor(
    htmlElement: HTMLElement,
    messageAgent: MessageAgent<KindMessageDataObject>,
  ) {
    this.messageAgent = messageAgent;

    // 各要素を取得および設定
    this.wrapDiv = assertNotNull(
      htmlElement.querySelector<HTMLDivElement>("#editor-wrap"),
    );
    this.header = assertNotNull(
      htmlElement.querySelector<HTMLDivElement>("#editor-header"),
    );
    this.loadingDiv = assertNotNull(
      htmlElement.querySelector<HTMLDivElement>("#editor-loading"),
    );
    this.editorFrame = assertNotNull(
      htmlElement.querySelector<HTMLIFrameElement>("#editor-frame"),
    );
    this.previewFrame = assertNotNull(
      htmlElement.querySelector<HTMLIFrameElement>("#preview-frame"),
    );

    // エディターの URL を設定
    this.editorFrame.src = chrome.runtime.getURL("code-editor-tabs.html");

    // イベント設定
    this.recieveMessageSetting();
    this.clickSetting();
    this.dblClickSetting();
    this.loadingSetting();
    this.draggableSetting();
    this.resizableSetting();

    // コピーコードボタンを初期化
    this.copyCodeButton = new CopyCodeButtonElement(
      this.header,
      this.clipboardSave.bind(this),
    );
  }

  /**
   * メッセージ受信の設定をします。
   */
  private recieveMessageSetting() {
    this.messageAgent.windowMessageListener(async (messageData) => {
      // z-indexでタブを表現
      if (
        messageData.kind === MSG_KIND.TabChanged &&
        messageData.subKind === MSG_SUBKIND.PREVIEW
      ) {
        const outerHTML = messageData.message;
        this.previewFrame.srcdoc = outerHTML;
        this.editorFrame.style.transition = "z-index 0.3s ease";
        this.previewFrame.style.transition = "z-index 0.3s ease";

        this.editorFrame.style.zIndex = "0";
        this.previewFrame.style.zIndex = "10";
        this.previewFrame.style.opacity = "1";
        this.previewFrame.focus();
        return;
      }

      if (messageData.kind === MSG_KIND.TabChanged) {
        this.editorFrame.style.zIndex = "10";
        this.previewFrame.style.zIndex = "0";
        this.previewFrame.style.opacity = "0";
        return;
      }

      if (messageData.kind === MSG_KIND.Save) {
        await this.messageAgent.sendRuntimeMessage(messageData, undefined);
        return;
      }

      if (messageData.kind === MSG_KIND.Clipboard) {
        navigator.clipboard.writeText(messageData.message);
        return;
      }

      throw new Error();
    });
  }

  /**
   * エディターにコードを送信するためのクリックイベントの設定をします。
   */
  private clickSetting() {
    // alt + clickでエディターにコードを送信
    document.addEventListener("click", async (event) => {
      const postFunc = async (language: PREFIEXED_LANGUAGE) => {
        if (!(event.target instanceof HTMLElement) || !event.altKey) {
          return;
        }

        const preElement = findParentPreElement(event.target);
        const codeElement = preElement?.querySelector("." + language);
        if (!codeElement) {
          return;
        }

        await this.messageAgent.postWindowMessage(
          assertNotNull(this.editorFrame.contentWindow),
          EXT_ORIGIN,
          {
            runtimeId: chrome.runtime.id,
            message: codeElement.textContent ?? "",
            kind: MSG_KIND.TabUpdate,
            subKind: language,
          },
        );
      };
      await postFunc(PREFIEXED_LANGUAGE.HTML);
      await postFunc(PREFIEXED_LANGUAGE.CSS);
      await postFunc(PREFIEXED_LANGUAGE.JAVASCRIPT);
    });
  }

  /**
   * エディターをダブルクリックで非表示にする設定をします。
   */
  private dblClickSetting() {
    // グリップ部分をダブルクリックでエディターを非表示に
    this.header.addEventListener("dblclick", () => {
      if (this.editorFrame.style.display === "none") {
        this.editorFrame.style.display = "block";
        this.previewFrame.style.display = "block";
        return;
      }

      this.editorFrame.style.display = "none";
      this.previewFrame.style.display = "none";
    });
  }

  /**
   * ロード中表示の設定をします。
   */
  private async loadingSetting() {
    this.editorFrame.addEventListener("load", async () => {
      // バックグラウンドに保存されたコードを取得して、各タブに送信
      const loadFunc = async (msgSubKind: MSG_SUBKIND) => {
        const response = (await this.messageAgent.sendRuntimeMessage(
          {
            runtimeId: chrome.runtime.id,
            message: "",
            kind: MSG_KIND.Load,
            subKind: msgSubKind,
          },
          undefined,
        )) as KindMessageDataObject;

        if (!response) {
          return;
        }

        await this.messageAgent.postWindowMessage(
          assertNotNull(this.editorFrame.contentWindow),
          EXT_ORIGIN,
          response,
        );
      };

      await loadFunc(MSG_SUBKIND.HTML);
      await loadFunc(MSG_SUBKIND.CSS);
      await loadFunc(MSG_SUBKIND.JAVASCRIPT);
      this.loadingDiv.remove();
    });
  }

  /**
   * エディターにドラッグ移動の設定をします。
   */
  private draggableSetting() {
    InteractJsUtils.draggableSetting(
      this.header,
      this.wrapDiv,
      // 移動中はmonaco editorのイベントを無視
      () => {
        this.editorFrame.style.pointerEvents = "none";
        this.previewFrame.style.pointerEvents = "none";
      },
      // 無視したイベントを戻す
      () => {
        this.editorFrame.style.pointerEvents = "auto";
        this.previewFrame.style.pointerEvents = "auto";
      },
    );
  }

  /**
   * エディターにリサイズの設定をします。
   */
  private resizableSetting() {
    // Ignore events as Monaco Editor reacts during movement
    InteractJsUtils.resizableSetting(
      this.wrapDiv,
      // 移動中はmonaco editorのイベントを無視
      () => {
        this.editorFrame.style.pointerEvents = "none";
        this.previewFrame.style.pointerEvents = "none";
      },
      // 無視したイベントを戻す
      () => {
        this.editorFrame.style.pointerEvents = "auto";
        this.previewFrame.style.pointerEvents = "auto";
      },
    );
  }

  /**
   * クリップボードへの保存を通知します。
   */
  private async clipboardSave() {
    await this.messageAgent.postWindowMessage(
      assertNotNull(this.editorFrame.contentWindow),
      EXT_ORIGIN,
      {
        runtimeId: chrome.runtime.id,
        message: "",
        kind: MSG_KIND.Clipboard,
        subKind: "",
      },
    );
  }
}

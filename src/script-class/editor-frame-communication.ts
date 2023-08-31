import {
  EXT_ORIGIN,
  MessageAgent,
  assertNotNull,
} from "@nyanator/chrome-ext-utils";
import { EditorElements } from "editor/editor-element";

import {
  KindMessageData,
  MSG_KIND,
  MSG_SUBKIND,
  PREFIEXED_LANGUAGE,
} from "../utils/message-def";

/**
 * Editorフレームとの通信を担います
 */
export class EditorFrameCommunication {
  /**
   * EditorFrameCommunication クラスのインスタンスを初期化します。
   * @param messageAgent コンテキスト間メッセージ通信オブジェクト
   */
  constructor(
    private readonly messageAgent: MessageAgent<KindMessageData>,
    private readonly editorElements: EditorElements,
  ) {
    this.setupListeners();
  }

  /**
   * リスナーを設定します。
   */
  private setupListeners() {
    // エディターフレームからのウィンドウメッセージリスナーを設定
    this.messageAgent.windowMessageListener(async (messageData) => {
      if (!this.editorElements?.editor) {
        return;
      }

      // z-indexでタブを表現
      if (
        messageData.kind === MSG_KIND.TabChanged &&
        messageData.subKind === MSG_SUBKIND.PREVIEW
      ) {
        changeTab(this.editorElements.elements, messageData, true);
        return;
      }

      if (messageData.kind === MSG_KIND.TabChanged) {
        changeTab(elementLoader.elements, messageData, false);
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
   * 選択したコード要素の内容をTabに送信
   * @param language 対象の言語
   * @param codeElement 選択したコード要素
   */
  private async postCodeToTab(
    language: PREFIEXED_LANGUAGE,
    codeElement: HTMLElement,
  ) {
    await this.messageAgent.postWindowMessage(
      assertNotNull(this.editorElements.editor.contentWindow),
      EXT_ORIGIN,
      {
        runtimeId: chrome.runtime.id,
        message: codeElement.textContent ?? "",
        kind: MSG_KIND.TabUpdate,
        subKind: language,
      },
    );
  }

  /**
   * バックグラウンドに保存されたコードを取得して、エディターフレームに送信
   * @param msgSubKind メッセージサブ種別
   * @param editorFrame 通知先のエディターフレーム
   * @param messageAgent コンテキスト間通信オブジェクト
   */
  private async loadEditorData(
    msgSubKind: MSG_SUBKIND,
    editorFrame: HTMLIFrameElement,
  ): Promise<void> {


    // エディターフレームに取得データを送信
    await this.messageAgent.postWindowMessage(
      assertNotNull(this.editorElements.editor.contentWindow),
      EXT_ORIGIN,
      response,
    );
  }

  /**
   * クリップボードへの保存を通知します。
   */
  private async clipboardSave() {
    await this.messageAgent.postWindowMessage(
      assertNotNull(this.editorElements.editor.contentWindow),
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

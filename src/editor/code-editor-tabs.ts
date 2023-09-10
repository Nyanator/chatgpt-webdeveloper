/**
 * エディタータブを生成し、クリックなどのイベントを管理します。
 */
import {
  AlertNamedError,
  EXT_ORIGIN,
  MessageData,
  WindowMessageAgent,
  assertNotNull,
} from "@nyanator/chrome-ext-utils";
import { inject, injectable } from "tsyringe";

import { LANGUAGE_PREFIX, MSG_CHANNEL, PREFIEXED_LANGUAGE } from "../utils/msg-def";

import { MonacoEditorTab } from "./tabs/monaco-editor-tab";
import { PreviewTab } from "./tabs/preview-tab";
import { Tab } from "./tabs/tab";

@injectable()
export class CodeEditorTab {
  // タブとエディターの情報を保持する配列とマップ
  readonly tabObjects: Tab[] = [];
  readonly editors = new Map();

  constructor(@inject("WindowMessageAgent") readonly messageAgent: WindowMessageAgent) {}

  /**
   * タブを生成してイベントを設定します。
   */
  readonly createTabs = (): void => {
    // DOM要素を取得
    const headerElement = document.querySelector<HTMLElement>(".header");
    const contentElement = document.querySelector<HTMLElement>(".content");
    if (!headerElement || !contentElement) {
      return;
    }

    // タブ要素とコンテンツ要素を取得
    const tabsElements = [...Array.from(headerElement.children)];
    const tabContentsElements = [...Array.from(contentElement.children)];

    if (tabsElements.length !== tabContentsElements.length) {
      throw new Error();
    }

    // タブオブジェクトを生成して配列に追加
    tabsElements.forEach((tabElement, index) => {
      if (!(tabElement instanceof HTMLElement)) {
        throw new Error();
      }

      const kind = assertNotNull(tabElement.dataset.kind);
      const tabContent = tabContentsElements[index];
      if (!(tabContent instanceof HTMLElement)) {
        throw new Error();
      }

      let clickedTab: Tab | undefined = undefined;

      if (kind === PREFIEXED_LANGUAGE.PREVIEW) {
        const previewTab = new PreviewTab(
          tabElement,
          tabContent,
          this.editors.get(PREFIEXED_LANGUAGE.HTML),
          this.editors.get(PREFIEXED_LANGUAGE.JS),
          this.editors.get(PREFIEXED_LANGUAGE.CSS),
          this.messageAgent,
        );
        this.tabObjects.push(previewTab);
      } else if (kind.startsWith(LANGUAGE_PREFIX)) {
        const monacoEditorTab = new MonacoEditorTab(tabElement, tabContent, this.messageAgent);
        this.editors.set(kind, monacoEditorTab);
        this.tabObjects.push(monacoEditorTab);
      } else {
        throw new Error();
      }

      clickedTab = this.tabObjects[index];

      // クリックイベントを設定
      tabElement.addEventListener("click", () => {
        if (clickedTab) {
          this.activateTab(clickedTab);
        }
      });
      index++;
    });
  };

  /**
   * 指定されたタブをアクティブにします。
   * @param activateTab アクティブにするタブ
   */
  readonly activateTab = (activateTab: Tab): void => {
    this.tabObjects.forEach((tab) => {
      if (activateTab === tab) {
        tab.activate();
        return;
      }
      tab.deactivate();
    });
  };

  /** クリップボードの保存イベント。*/
  readonly saveClipboard = async (): Promise<void> => {
    const activeTab = this.tabObjects.find((tab) => tab.isActive());
    await activeTab?.saveClipboard();
  };

  /**
   * タブにデータを設定します。
   * @param messageData メッセージ通知
   */
  readonly setTabData = async (messageData: MessageData): Promise<void> => {
    const editor = this.editors.get(assertNotNull(messageData.key));
    editor?.setValue(messageData.message);
  };

  /**
   * タブにデータを設定します。
   * @param messageData メッセージ通知
   */
  readonly updateTab = async (messageData: MessageData): Promise<void> => {
    // エディターへのメッセージ反映とタブの更新処理
    const editor = this.editors.get(assertNotNull(messageData.key));
    editor?.setValue(messageData.message);

    this.activateTab(editor);
    try {
      await this.messageAgent.postMessage(window.parent, EXT_ORIGIN, MSG_CHANNEL.DatabaseSave, {
        runtimeId: chrome.runtime.id,
        key: messageData.key,
        message: messageData.message,
      });
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.DatabaseSave, error);
    }
  };
}

/**
 * @file エディタータブを生成し、クリックなどのイベントを管理します。
 */
import {
  EXT_ORIGIN,
  assertNotNull,
  createMessageAgent,
  reserveLoadedAction,
} from "@nyanator/chrome-ext-utils";

import * as ChatGPTUtils from "../utils/chat-gpt-utils";
import {
  KindMessageData,
  LANGUAGE_PREFIX,
  MSG_KIND,
  PREFIEXED_LANGUAGE,
} from "../utils/message-def";

import { MonacoEditorTab } from "./tabs/monaco-editor-tab";
import { PreviewTab } from "./tabs/preview-tab";
import { Tab } from "./tabs/tab";

// IIFE
(async () => {
  // コンテキスト間のメッセージ通信を準備
  const messageAgent = await createMessageAgent<KindMessageData>({
    runtimeId: chrome.runtime.id,
    allowedOrigins: [ChatGPTUtils.ORIGIN, EXT_ORIGIN],
  });

  // タブとエディターの情報を保持する配列とマップ
  const tabObjects: Tab[] = [];
  const editors = new Map();

  // Chrome 拡張機能の読み込み完了後の処理
  reserveLoadedAction(document, () => {
    createTabs();
    messageRecieveSetting();
  });

  /**
   * タブを生成してイベントを設定します。
   */
  function createTabs() {
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

      if (kind === "preview") {
        const previewTab = new PreviewTab(
          tabElement,
          tabContent,
          editors.get(PREFIEXED_LANGUAGE.HTML),
          editors.get(PREFIEXED_LANGUAGE.JS),
          editors.get(PREFIEXED_LANGUAGE.CSS),
          messageAgent,
        );
        tabObjects.push(previewTab);
      } else if (kind.startsWith(LANGUAGE_PREFIX)) {
        const monacoEditorTab = new MonacoEditorTab(
          tabElement,
          tabContent,
          messageAgent,
        );
        editors.set(kind, monacoEditorTab);
        tabObjects.push(monacoEditorTab);
      } else {
        throw new Error();
      }

      clickedTab = tabObjects[index];

      // クリックイベントを設定
      tabElement.addEventListener("click", () => {
        if (clickedTab) {
          activateTab(clickedTab);
        }
      });
      index++;
    });
  }

  /**
   * 指定されたタブをアクティブにします。
   * @param activateTab アクティブにするタブ
   */
  function activateTab(activateTab: Tab) {
    tabObjects.forEach((tab) => {
      if (activateTab === tab) {
        tab.activate();
        return;
      }
      tab.deactivate();
    });
  }

  /**
   * メッセージ受信の設定をします。
   */
  function messageRecieveSetting() {
    messageAgent.windowMessageListener(async (messageData) => {
      // クリップボードへの保存要求の処理
      if (messageData.kind === MSG_KIND.Clipboard) {
        const activeTab = tabObjects.find((tab) => tab.isActive());
        await activeTab?.saveClipboard();
        return;
      }

      // エディターへのメッセージ反映とタブの更新処理
      const editor = editors.get(messageData.subKind);
      editor?.setValue(messageData.message);

      if (messageData.kind !== MSG_KIND.TabUpdate) {
        return;
      }

      activateTab(editor);
      await messageAgent.postWindowMessage(window.parent, EXT_ORIGIN, {
        runtimeId: chrome.runtime.id,
        message: messageData.message,
        kind: MSG_KIND.Save,
        subKind: messageData.subKind,
      });
    });
  }
})();

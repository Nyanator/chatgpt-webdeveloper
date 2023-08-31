/**
 * @file htmlプレビュー監視
 * Chat GPTのDOM要素を監視して、htmlプレビューを表示します。
 * DOMを操作するためコンテンツスクリプトで読み込みます。
 */
import {
  EXT_ORIGIN,
  createMessageAgent,
  findParentPreElement,
  htmlTextToHtmlElement,
  isInView,
  reserveLoadedAction,
} from "@nyanator/chrome-ext-utils";

import * as ChatGPTUtils from "../utils/chat-gpt-utils";
import {
  KindMessageData,
  MSG_KIND,
  PREFIEXED_LANGUAGE,
} from "../utils/message-def";

import * as HTMLPreviewCreater from "./html-preview-creater";

// IIFE
(async () => {
  // コンテキスト間でのメッセージ通信を準備
  const messageAgent = await createMessageAgent<KindMessageData>({
    runtimeId: chrome.runtime.id,
    allowedOrigins: [ChatGPTUtils.ORIGIN, EXT_ORIGIN],
  });

  // アニメーション効果のためにコードブロックの開始と終了を保持
  let codeBlockStarted = false;
  let codeBlockEnded = false;

  // Intersection Observer を作成して、表示状態の HTML プレビューを管理
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!(entry.target instanceof HTMLElement)) {
          return;
        }

        entry.isIntersecting
          ? renderHtmlPreview(entry.target)
          : removeHtmlPreview(entry.target);
      });
    },
    // Intersection Observerの交差判定オフセット
    { root: null, rootMargin: "0px", threshold: 0 },
  );

  // MutationObserverを作成して、DOM の変更を監視
  const mutationObserver = new MutationObserver((mutationsList) => {
    checkMutationAndRserveObserve(mutationsList);
  });

  // ダブルクリックと Ctrl キーの組み合わせで HTML プレビューを表示
  document.addEventListener("dblclick", (event) => {
    if (!(event.target instanceof HTMLElement) || !event.ctrlKey) {
      return;
    }

    showHTMLWindow(event.target);
  });

  // Chrome 拡張機能の読み込み完了後の処理
  reserveLoadedAction(document, () => {
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    reserveObeserve();

    // コンテキスト間メッセージリスナーを設定
    messageAgent.runtimeMessageListener(async (message: KindMessageData) => {
      if (message.kind === MSG_KIND.UrlUpdated) {
        codeBlockStarted = false;
        codeBlockEnded = false;
        reserveObeserve();
      }
      return;
    });
  });

  /**
   * HTML プレビューを描画します
   */
  function renderHtmlPreview(codeElement: HTMLElement) {
    const codeBlockDiv =
      ChatGPTUtils.findCodeBlockDivFromCodeElement(codeElement);
    if (
      !(codeBlockDiv instanceof HTMLDivElement) ||
      !(codeBlockDiv.parentElement instanceof HTMLPreElement)
    ) {
      return;
    }

    const oldPreviewWrapDiv = codeBlockDiv?.parentElement?.querySelector(
      "." + HTMLPreviewCreater.MYCLASS,
    );
    const previewHtml = htmlTextToHtmlElement(codeElement.textContent ?? "");

    // パフォーマンスのために描画の途中経過ではScriptを実行しません
    const allowScripts = codeBlockEnded === true || codeBlockStarted === false;
    if (oldPreviewWrapDiv && codeBlockEnded !== true) {
      codeBlockEnded = false;
      const oldPreviewFrame = oldPreviewWrapDiv.querySelector("iframe");
      if (!(oldPreviewFrame instanceof HTMLIFrameElement)) {
        return;
      }
      // 内容が変わっていない場合そのフレームは無視します
      // 大量のフレームが表示されることによるちらつきを軽減します
      if (oldPreviewFrame && oldPreviewFrame.srcdoc === previewHtml.outerHTML) {
        return;
      }
    }
    codeBlockEnded = false;
    codeBlockDiv.parentElement.style.overflowY = "hidden";

    const previewElement = HTMLPreviewCreater.createPreviewElement(
      codeBlockDiv,
      allowScripts,
      previewHtml.outerHTML,
    );

    // アニメーション効果のための z-index の重ね合わせ
    if (oldPreviewWrapDiv) {
      oldPreviewWrapDiv.appendChild(previewElement.previewDiv);
    } else {
      codeBlockDiv.parentElement.appendChild(previewElement.wrapDiv);
    }
  }

  /**
   * 描画領域から外れた HTML プレビューを削除します
   */
  function removeHtmlPreview(codeElement: HTMLElement) {
    const codeBlockDiv =
      ChatGPTUtils.findCodeBlockDivFromCodeElement(codeElement);

    const previewWrapDiv = codeBlockDiv?.parentElement?.querySelector(
      "." + HTMLPreviewCreater.MYCLASS,
    );
    if (!previewWrapDiv || isInView(window, previewWrapDiv)) {
      return;
    }

    previewWrapDiv.remove();
  }

  /**
   * DOM の変更を監視し、必要に応じて監視を予約します
   */
  function checkMutationAndRserveObserve(mutationsList: MutationRecord[]) {
    const addNodes = mutationsList.flatMap((ml) => Array.from(ml.addedNodes));
    // ボディ内にボタンが存在する可能性があるため、HTML 要素のみをフィルタリング
    const htmlElements = addNodes
      .filter(
        (node) => node instanceof HTMLElement && node.nodeName !== "BUTTON",
      )
      .map((node) => node);
    if (htmlElements.length === 0) {
      return;
    }
    const htmls = htmlElements
      .map((node) => (node as HTMLElement).outerHTML ?? "")
      .join();
    if (htmls.includes(HTMLPreviewCreater.MYCLASS)) {
      return;
    }

    // コードブロックの開始と終了を検出
    const containsCodeBlock = htmls.includes('<span class="hljs');
    if (containsCodeBlock) {
      const containsCodeBlockTerminate = htmls.includes(
        `<span class="hljs-tag">&lt;/<span class="hljs-name">html</span>&gt;</span>`,
      );
      codeBlockStarted = !containsCodeBlockTerminate;
      codeBlockEnded = containsCodeBlockTerminate;
      reserveObeserve();
    } else if (codeBlockStarted) {
      codeBlockStarted = false;
      codeBlockEnded = true;
      reserveObeserve();
    }
  }

  /**
   * 指定したElementの親のPreから見たHTMLウインドウを表示します。
   * @param targetElement HTML要素
   */
  async function showHTMLWindow(targetElement: HTMLElement) {
    const preElement = findParentPreElement(targetElement);
    if (!preElement) {
      return;
    }

    const codeElement = preElement.querySelector("." + PREFIEXED_LANGUAGE.HTML);
    if (!codeElement) {
      return;
    }

    // バックグラウンドに通知
    await messageAgent.sendRuntimeMessage(
      {
        runtimeId: chrome.runtime.id,
        message: codeElement.textContent ?? "",
        kind: MSG_KIND.ShowHTMLWindow,
        subKind: undefined,
      },
      undefined,
    );
  }

  /**
   * オブザーバーの再設定を予約します。
   */
  function reserveObeserve() {
    intersectionObserver.disconnect();

    // Chrome 拡張機能の読み込み完了後の処理
    ChatGPTUtils.reserveLoadedAction(() => {
      setFormZIndex();
      addClickListenerNewChatButton();
      observeIntersectionTarget();
    });
  }

  /**
   * フォームの z-index を設定して表示崩れを防ぎます。
   */
  function setFormZIndex() {
    const formDiv = ChatGPTUtils.findInputForm();
    if (!formDiv) {
      return;
    }

    formDiv.style.zIndex = "2147483647"; // z-indexの最大値
  }

  /**
   * New chatボタンにクリックイベントを設定します。
   * ボタンが連続して使用される場合、URL の遷移が発生しないためです。
   */
  function addClickListenerNewChatButton() {
    const newChatButton = ChatGPTUtils.findNewChatButton();
    if (!newChatButton) {
      return;
    }
    newChatButton.addEventListener("click", () => {
      reserveObeserve();
    });
  }

  /**
   * コード要素を監視する Intersection Observer を作成します。
   */
  async function observeIntersectionTarget() {
    await new Promise<void>((resolve) => {
      window.requestIdleCallback(
        () => {
          intersectionObserver.disconnect();
          const codeElements = document.body.querySelectorAll(
            "." + PREFIEXED_LANGUAGE.HTML,
          );
          codeElements.forEach((element) => {
            intersectionObserver.observe(element);
          });
          resolve();
        },
        { timeout: 3000 },
      );
    });
  }
})();

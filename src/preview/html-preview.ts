/**
 * @file htmlプレビュー監視
 * Chat GPTのDOM要素を監視して、htmlプレビューを表示します。
 * DOMを操作するためコンテンツスクリプトで読み込みます。
 */
import {
  RuntimeMessageAgent,
  findParentPreElement,
  htmlTextToHtmlElement,
  isInView,
  reserveLoadedAction,
} from "@nyanator/chrome-ext-utils";
import { inject, injectable } from "tsyringe";

import * as ChatGPTUtils from "../utils/chat-gpt-utils";
import { MSG_CHANNEL, PREFIEXED_LANGUAGE } from "../utils/msg-def";

import * as HTMLPreviewCreater from "./html-preview-creater";

@injectable()
export class HTMLPreview {
  // アニメーション効果のためにコードブロックの開始と終了を保持
  private codeBlockStarted = false;
  private codeBlockEnded = false;
  private readonly intersectionObserver;
  private readonly mutationObserver;

  constructor(@inject("RuntimeMessageAgent") readonly runtimeMessageAgent: RuntimeMessageAgent) {
    // Intersection Observer を作成して、表示状態の HTML プレビューを管理
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!(entry.target instanceof HTMLElement)) {
            return;
          }

          entry.isIntersecting ? this.renderHtmlPreview(entry.target) : this.removeHtmlPreview(entry.target);
        });
      },
      // Intersection Observerの交差判定オフセット
      { root: null, rootMargin: "0px", threshold: 0 },
    );

    // MutationObserverを作成して、DOM の変更を監視
    this.mutationObserver = new MutationObserver((mutationsList) => {
      this.checkMutationAndRserveObserve(mutationsList);
    });

    // Chrome 拡張機能の読み込み完了後の処理
    reserveLoadedAction(document, () => {
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
      this.reserveObeserve();

      // コンテキスト間メッセージリスナーを設定
      this.runtimeMessageAgent.addListener(MSG_CHANNEL.URLUpdated, async () => {
        this.codeBlockStarted = false;
        this.codeBlockEnded = false;
        this.reserveObeserve();
      });
    });

    // Ctrl + ダブルクリックでプレビュー表示
    document.addEventListener("dblclick", (event) => {
      if (!event.ctrlKey || !(event.target instanceof HTMLElement)) {
        return;
      }

      this.showHTMLWindow(event.target);
    });
  }

  /**
   * HTML プレビューを描画します
   */
  renderHtmlPreview(codeElement: HTMLElement): void {
    const codeBlockDiv = ChatGPTUtils.findCodeBlockDivFromCodeElement(codeElement);
    if (!(codeBlockDiv instanceof HTMLDivElement) || !(codeBlockDiv.parentElement instanceof HTMLPreElement)) {
      return;
    }

    const oldPreviewWrapDiv = codeBlockDiv?.parentElement?.querySelector("." + HTMLPreviewCreater.MYCLASS);
    const previewHtml = htmlTextToHtmlElement(codeElement.textContent ?? "");

    // パフォーマンスのために描画の途中経過ではScriptを実行しません
    const allowScripts = this.codeBlockEnded === true || this.codeBlockStarted === false;
    if (oldPreviewWrapDiv && this.codeBlockEnded !== true) {
      this.codeBlockEnded = false;
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

    this.codeBlockEnded = false;
    codeBlockDiv.parentElement.style.overflowY = "hidden";
    let outerHTML = previewHtml.outerHTML;
    if (!allowScripts) {
      outerHTML = outerHTML
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
    const previewElement = HTMLPreviewCreater.createPreviewElement(codeBlockDiv, outerHTML);

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
  removeHtmlPreview(codeElement: HTMLElement): void {
    const codeBlockDiv = ChatGPTUtils.findCodeBlockDivFromCodeElement(codeElement);

    const previewWrapDiv = codeBlockDiv?.parentElement?.querySelector("." + HTMLPreviewCreater.MYCLASS);
    if (!previewWrapDiv || isInView(window, previewWrapDiv)) {
      return;
    }

    previewWrapDiv.remove();
  }

  /**
   * DOM の変更を監視し、必要に応じて監視を予約します
   */
  checkMutationAndRserveObserve(mutationsList: MutationRecord[]): void {
    const addNodes = mutationsList.flatMap((ml) => Array.from(ml.addedNodes));
    // ボディ内にボタンが存在する可能性があるため、HTML 要素のみをフィルタリング
    const htmlElements = addNodes
      .filter((node) => node instanceof HTMLElement && node.nodeName !== "BUTTON")
      .map((node) => node);
    if (htmlElements.length === 0) {
      return;
    }
    const htmls = htmlElements.map((node) => (node as HTMLElement).outerHTML ?? "").join();
    if (htmls.includes(HTMLPreviewCreater.MYCLASS)) {
      return;
    }

    // コードブロックの開始と終了を検出
    const containsCodeBlock = htmls.includes('<span class="hljs');
    if (containsCodeBlock) {
      const containsCodeBlockTerminate = htmls.includes(
        `<span class="hljs-tag">&lt;/<span class="hljs-name">html</span>&gt;</span>`,
      );
      this.codeBlockStarted = !containsCodeBlockTerminate;
      this.codeBlockEnded = containsCodeBlockTerminate;
      this.reserveObeserve();
    } else if (this.codeBlockStarted) {
      this.codeBlockStarted = false;
      this.codeBlockEnded = true;
      this.reserveObeserve();
    }
  }

  /**
   * 指定したElementの親のPreから見たHTMLウインドウを表示します。
   * @param targetElement HTML要素
   */
  async showHTMLWindow(targetElement: HTMLElement): Promise<void> {
    const preElement = findParentPreElement(targetElement);
    if (!preElement) {
      return;
    }

    const codeElement = preElement.querySelector("." + PREFIEXED_LANGUAGE.HTML);
    if (!codeElement) {
      return;
    }

    // バックグラウンドに通知
    await this.runtimeMessageAgent.sendMessage(MSG_CHANNEL.ShowPreview, {
      message: codeElement.textContent ?? "",
    });
  }

  /**
   * オブザーバーの再設定を予約します。
   */
  reserveObeserve(): void {
    this.intersectionObserver.disconnect();

    // Chrome 拡張機能の読み込み完了後の処理
    ChatGPTUtils.reserveLoadedAction(() => {
      this.setFormZIndex();
      this.addClickListenerNewChatButton();
      this.observeIntersectionTarget();
    });
  }

  /**
   * フォームの z-index を設定して表示崩れを防ぎます。
   */
  setFormZIndex(): void {
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
  addClickListenerNewChatButton(): void {
    const newChatButton = ChatGPTUtils.findNewChatButton();
    if (!newChatButton) {
      return;
    }
    newChatButton.addEventListener("click", () => {
      this.reserveObeserve();
    });
  }

  /**
   * コード要素を監視する Intersection Observer を作成します。
   */
  async observeIntersectionTarget(): Promise<void> {
    await new Promise<void>((resolve) => {
      window.requestIdleCallback(
        () => {
          this.intersectionObserver.disconnect();
          const codeElements = document.body.querySelectorAll("." + PREFIEXED_LANGUAGE.HTML);
          codeElements.forEach((element) => {
            this.intersectionObserver.observe(element);
          });
          resolve();
        },
        { timeout: 3000 },
      );
    });
  }
}

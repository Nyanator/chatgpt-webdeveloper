/**
 * @file HTML プレビューを生成するためのユーティリティ関数とクラスを提供します。
 */
import { documentHeight, maxZIndex, totalHeight } from "@nyanator/chrome-ext-utils";

/** クラス名の定義 */
export const MYCLASS = "HTMLPreviewCreaterMyClass";

/**
 * プレビューを生成し、インスタンスを返します。
 * @param codeBlockDiv プレビュー対象のコードブロックの div 要素
 * @param outerHTML プレビューするコードブロックの HTML 文字列
 * @returns プレビューエレメントのインスタンス
 */
export const createPreviewElement = (codeBlockDiv: HTMLDivElement, outerHTML: string): HTMLPreviewElement => {
  const hTMLPreviewElement = new HTMLPreviewElement(codeBlockDiv, outerHTML);
  return hTMLPreviewElement;
};

/**
 * HTML プレビューを扱いやすくするためにラップしたクラスです。
 */
export class HTMLPreviewElement {
  readonly wrapDiv: HTMLDivElement;
  readonly previewDiv: HTMLDivElement;
  readonly previewFrame: HTMLIFrameElement;

  /**
   * HTML プレビューエレメントのインスタンスを生成します。
   * @param codeBlockDiv プレビュー対象のコードブロックの div 要素
   * @param outerHTML プレビューするコードブロックの HTML 文字列
   */
  constructor(codeBlockDiv: HTMLDivElement, outerHTML: string) {
    // ラップする要素を生成および設定
    this.wrapDiv = createWrapDiv();
    this.previewDiv = createPreviewDiv(codeBlockDiv);
    this.previewFrame = createPreviewFrame(outerHTML);

    // プレビューフレームの読み込みイベントの設定
    this.previewFrameLoadSetting();

    // 要素を階層的に組み立てる
    this.wrapDiv.appendChild(this.previewDiv);
    this.previewDiv.appendChild(this.previewFrame);
  }

  /**
   * プレビューフレームの読み込みイベントの設定をします。
   * フレームの高さや要素の配置を調整します。
   */
  private previewFrameLoadSetting() {
    this.previewFrame.addEventListener("load", () => {
      if (this.previewFrame.contentWindow === null) {
        return;
      }

      if (
        !(this.previewFrame instanceof HTMLIFrameElement) ||
        !(this.previewFrame.parentElement instanceof HTMLDivElement) ||
        !(this.previewFrame.parentElement.parentElement instanceof HTMLDivElement)
      ) {
        return;
      }

      // プレビューフレームの高さを調整
      let iframeHeight = documentHeight(this.previewFrame.contentWindow.document);
      // プレビューが高さ 0 のままの場合、仮に 600 に設定
      if (iframeHeight === 0) {
        iframeHeight = 600;
      }
      this.previewFrame.style.height = iframeHeight + "px";

      // 子要素の総高さを計算
      const calcedHeight = totalHeight(this.previewFrame.parentElement) - this.previewFrame.offsetHeight;

      // absolute な要素をサイズ計算から除外するために padding-bottom を設定
      const zIndex = maxZIndex(this.previewFrame.parentElement.parentElement) + 1;
      this.previewFrame.parentElement.style.zIndex = zIndex.toString();
      this.previewFrame.parentElement.parentElement.style.paddingBottom = iframeHeight + calcedHeight + "px";

      // 不要な iframe を削除
      Array.from(this.previewFrame.parentElement.parentElement.children).forEach((child) => {
        if (!(child instanceof HTMLElement) || child.style.zIndex === zIndex.toString()) {
          return;
        }
        child.remove();
      });
    });
  }
}

/**
 * アニメーション効果のために zIndex を調整したラップ div 要素を生成します。
 * @returns ラップ div 要素
 */
function createWrapDiv(): HTMLDivElement {
  const wrapDiv = document.createElement("div");
  wrapDiv.style.position = "relative";
  wrapDiv.classList.add(MYCLASS);
  wrapDiv.style.width = "100%";
  wrapDiv.style.zIndex = "0";
  wrapDiv.style.transition = "height 0.8s";

  return wrapDiv;
}

/**
 * プレビューをラップするdiv 要素を生成します。
 * @param codeBlockDiv プレビュー対象のコードブロックの div 要素
 * @returns プレビュー用の div 要素
 */
function createPreviewDiv(codeBlockDiv: HTMLDivElement): HTMLDivElement {
  const previewDiv = codeBlockDiv.cloneNode(true) as HTMLDivElement;
  previewDiv.style.marginBottom = "0";
  previewDiv.style.position = "absolute";
  previewDiv.style.top = "0";
  previewDiv.style.left = "0";
  previewDiv.style.width = "100%";
  previewDiv.style.height = "100%";
  previewDiv.style.backgroundColor = "rgb(0, 0, 0)";
  previewDiv.classList.add(MYCLASS);
  Array.from(previewDiv.children)
    .slice(1)
    .forEach((child) => (child.outerHTML = ""));

  createPreviewKind(previewDiv);

  return previewDiv;
}

/**
 * プレビューの種類を表示するdiv 要素を生成します。
 * @param previewDiv プレビュー用の div 要素
 */
function createPreviewKind(previewDiv: HTMLElement) {
  const previewKind = previewDiv.firstChild;
  if (!(previewKind instanceof HTMLDivElement)) {
    return;
  }

  previewKind.textContent = "preview";
  Array.from(previewKind.children)
    .slice(1)
    .forEach((child) => (child.outerHTML = ""));
}

/**
 * プレビューフレーム（iframe）要素を生成します。
 * @param outerHTML プレビューするコードブロックの HTML 文字列
 * @returns プレビューフレーム（iframe）要素
 */
function createPreviewFrame(outerHTML: string): HTMLIFrameElement {
  const previewFrame = document.createElement("iframe");
  previewFrame.style.height = "0";
  previewFrame.scrolling = "no";
  previewFrame.style.width = "100%";
  previewFrame.setAttribute("loading", "lazy");
  previewFrame.srcdoc = outerHTML;

  return previewFrame;
}

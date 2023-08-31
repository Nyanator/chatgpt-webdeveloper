import {
  appendStyleTextToHead,
  createFetchElementLoader,
  CrossDispatcher,
  defineElements,
  ElementMap,
  loadResourceText,
} from "@nyanator/chrome-ext-utils";

import { ContentScriptChannel } from "interfaces/content-peer-content";
import * as InteractJsUtils from "../utils/interactjs-utils";
import { KindMessageData } from "../utils/message-def";

// prettier-ignore
const EditorElements = defineElements({
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
});
export type EditorElements = ElementMap<typeof EditorElements>;

/**
 * エディター要素を生成します。
 * @param parentElement 親要素
 * @returns エディター要素
 */
export const createEditorElement = async (
  parentElement: HTMLElement,
  crossDispathcer: CrossDispatcher<ContentScriptChannel>,
): Promise<EditorElements> => {
  // CSS を読み込み、スタイルを適用
  const cssText = await loadResourceText("editor-element.css");
  appendStyleTextToHead(parentElement, cssText);

  // Elementを静的型付けで読み込み
  const elementLoader = createFetchElementLoader(
    EditorElements,
    "editor-element.html",
  );
  await elementLoader.loadElements();
  elementLoader.addEventListeners([
    {
      element: "editor",
      events: {
        load: async () => {
          // バックグラウンドに保存されたコードを取得して、各タブに送信
          await crossDispathcer.dispatch("loadDataRequest", "html");
          await crossDispathcer.dispatch("loadDataRequest", "css");
          await crossDispathcer.dispatch("loadDataRequest", "javascript");
          elementLoader.elements.loading.remove();
        },
      },
    },
    {
      element: "copyCodeButton",
      events: {
        click: () => {
          // クリップボードに保存を通知
          clipboardSave(elementLoader.elements.editor, messageAgent);

          // ボタンのアニメーション効果
          toggleAnimation(elementLoader.elements, true);
          setTimeout(
            () => toggleAnimation(elementLoader.elements, false),
            2000,
          );
        },
      },
    },
    {
      element: "header",
      events: {
        doubleClick: () => toggleEditor(elementLoader.elements),
      },
    },
  ]);

  // 移動可能に
  InteractJsUtils.draggableSetting(
    elementLoader.elements.header,
    elementLoader.elements.wrap,
    () => handleEventsDuringInteraction(elementLoader.elements),
    () => restoreEventsAfterInteraction(elementLoader.elements),
  );

  // リサイズ可能に
  InteractJsUtils.resizableSetting(
    elementLoader.elements.wrap,
    () => handleEventsDuringInteraction(elementLoader.elements),
    () => restoreEventsAfterInteraction(elementLoader.elements),
  );

  elementLoader.elements.editor.src = chrome.runtime.getURL(
    "code-editor-tabs.html",
  );

  parentElement.appendChild(elementLoader.elements.wrap);
  return elementLoader.elements;
};

/**
 * タブ変更時処理
 * @param editorElements エディター要素
 * @param messageData メッセージデータ
 * @param isPreview プレビュータブの場合 true、それ以外はfalse
 */
function changeTab(
  elements: EditorElements,
  messageData: KindMessageData,
  isPreview: boolean,
) {
  // z-indexでタブを表現
  if (isPreview) {
    const outerHTML = messageData.message;
    elements.preview.srcdoc = outerHTML;
    elements.editor.style.transition = "z-index 0.3s ease";
    elements.preview.style.transition = "z-index 0.3s ease";

    elements.editor.style.zIndex = "0";
    elements.preview.style.zIndex = "10";
    elements.preview.style.opacity = "1";
    elements.preview.focus();
  } else {
    elements.editor.style.zIndex = "10";
    elements.preview.style.zIndex = "0";
    elements.preview.style.opacity = "0";
  }
}

/**
 * インタラクション操作開始時の処理
 * @param editorElements エディター要素
 */
function handleEventsDuringInteraction(elements: EditorElements) {
  elements.editor.style.pointerEvents = "none";
  elements.preview.style.pointerEvents = "none";
}

/**
 * インタラクション操作終了時処理
 * @param editorElements エディター要素
 */
function restoreEventsAfterInteraction(elements: EditorElements) {
  elements.editor.style.pointerEvents = "auto";
  elements.preview.style.pointerEvents = "auto";
}

/**
 * Copy Codeボタンのアニメーション効果
 * @param editorElements エディター要素
 * @param activate コピー中=true,コピー完了false
 */
function toggleAnimation(
  editorElements: EditorElements,
  activate: boolean,
): void {
  const style = (elem: SVGPathElement | HTMLSpanElement, value: string) =>
    (elem.style.display = value);

  const displayValues = activate
    ? ["none", "none", "inline", "none", "inline"]
    : ["inline", "inline", "none", "inline", "none"];

  [
    editorElements.copyPath,
    editorElements.copyRect,
    editorElements.copyPolyline,
    editorElements.copyTextBefore,
    editorElements.copyTextAfter,
  ].forEach((elem, index) => {
    style(elem, displayValues[index]);
  });
}

/**
 * エディターを開閉します
 * @param editorElements エディター要素
 */
function toggleEditor(editorElements: EditorElements): void {
  if (editorElements.editor.style.display === "none") {
    editorElements.editor.style.display = "block";
    editorElements.preview.style.display = "block";
    return;
  }

  editorElements.editor.style.display = "none";
  editorElements.preview.style.display = "none";
}

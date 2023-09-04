import {
    CrossDispatcher,
    ElementMap,
    FetchElementLoader,
    appendStyleTextToHead,
    defineElements,
    loadResourceText,
} from "@nyanator/chrome-ext-utils";

import { ContentScriptChannel } from "../interfaces/content-peer-content";
import { EditorElementEventListener } from "../interfaces/editor-element-event-listener";
import { EditorElementToContentDispathcerSender } from "../interfaces/editor-element-to-content-dispathcer-sender";
import * as InteractJsUtils from "../utils/interactjs-utils";

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
 * エディター要素を初期化します。
 * @param parentElement 親要素
 * @param crossDispathcer ディスパッチャーオブジェクト
 */
export const initializeEditorElement = async (arg: {
    parentElement: HTMLElement;
    crossDispathcer: CrossDispatcher<ContentScriptChannel>;
}): Promise<EditorElements> => {
    const cssText = await loadResourceText("editor-element.css");
    appendStyleTextToHead(arg.parentElement, cssText);

    const elementLoader = FetchElementLoader({
        spec: EditorElements,
        path: "editor-element.html",
    });
    await elementLoader.load();

    editorElementsIntaractionSetting(elementLoader.elements);

    const editorElementToContentDispathcerSender =
        new EditorElementToContentDispathcerSender(arg.crossDispathcer);

    const editorElementEventListener = new EditorElementEventListener(
        elementLoader,
        arg.crossDispathcer,
        editorElementToContentDispathcerSender,
    );
    editorElementEventListener.startListener();

    elementLoader.elements.editor.src = chrome.runtime.getURL(
        "code-editor-tabs.html",
    );

    arg.parentElement.appendChild(elementLoader.elements.wrap);
    return elementLoader.elements;
};

/**
 * エディターのドラッグ、リサイズ設定。
 * @param editorElements エディター要素
 */
function editorElementsIntaractionSetting(editorElements: EditorElements) {
    InteractJsUtils.draggableSetting(
        editorElements.header,
        editorElements.wrap,
        () => handleEventsDuringInteraction(editorElements),
        () => restoreEventsAfterInteraction(editorElements),
    );

    InteractJsUtils.resizableSetting(
        editorElements.wrap,
        () => handleEventsDuringInteraction(editorElements),
        () => restoreEventsAfterInteraction(editorElements),
    );
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

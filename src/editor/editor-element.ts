import {
    CrossDispatcher,
    ElementLoader,
    ElementMap,
    FetchElementLoader,
    appendStyleTextToHead,
    defineElements,
    loadResourceText,
} from "@nyanator/chrome-ext-utils";

import { ContentScriptChannel } from "../interfaces/content-peer-content";
import { ContentPeerEditorMessage } from "../interfaces/content-peer-editor";
import * as InteractJsUtils from "../utils/interactjs-utils";
import { PREFIEXED_LANGUAGE } from "../utils/language-def";

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

type Context = {
    elementLoader: ElementLoader<EditorElements>;
    contentPeerEditorCrossDispather: CrossDispatcher<ContentScriptChannel>;
};

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

    const context = {
        elementLoader: elementLoader,
        contentPeerEditorCrossDispather: arg.crossDispathcer,
    };

    setupEditorElementsListener(context);

    editorElementsIntaractionSetting(elementLoader.elements);

    setupDispatcherChannel(context);

    elementLoader.elements.editor.src = chrome.runtime.getURL(
        "code-editor-tabs.html",
    );

    arg.parentElement.appendChild(elementLoader.elements.wrap);
    return elementLoader.elements;
};

/**
 * エディターのイベントリスナーを設定します。
 * @param context コンテキストオブジェクト
 */
function setupEditorElementsListener(context: Context) {
    context.elementLoader.addListeners([
        {
            element: "editor",
            events: {
                load: async () => {
                    await context.contentPeerEditorCrossDispather.dispatch({
                        channelKey: "LoadDataRequest",
                        channelData: PREFIEXED_LANGUAGE.HTML,
                    });
                    await context.contentPeerEditorCrossDispather.dispatch({
                        channelKey: "LoadDataRequest",
                        channelData: PREFIEXED_LANGUAGE.JS,
                    });
                    await context.contentPeerEditorCrossDispather.dispatch({
                        channelKey: "LoadDataRequest",
                        channelData: PREFIEXED_LANGUAGE.CSS,
                    });
                    context.elementLoader.elements.loading.remove();
                },
            },
        },
        {
            element: "copyCodeButton",
            events: {
                click: () => {
                    context.contentPeerEditorCrossDispather.dispatch({
                        channelKey: "ClipboardSaveRequest",
                        channelData: undefined,
                    });

                    toggleAnimation(context.elementLoader.elements, true);
                    setTimeout(
                        () =>
                            toggleAnimation(
                                context.elementLoader.elements,
                                false,
                            ),
                        2000,
                    );
                },
            },
        },
        {
            element: "header",
            events: {
                doubleClick: () => toggleEditor(context.elementLoader.elements),
            },
        },
    ]);
}

/**
 * コンテンツスクリプト間のメッセージチャンネルを開通します。
 * @param context コンテキストオブジェクト
 */
function setupDispatcherChannel(context: Context) {
    context.contentPeerEditorCrossDispather.channel({
        TabChangedEvent: (messageData) => {
            changeTab(context.elementLoader.elements, messageData);
        },
    });
}

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
 * タブ変更時処理
 * @param editorElements エディター要素
 * @param messageData プレビュータブのときのhtmlの内容
 * @param isPreview プレビュータブの場合 true、それ以外はfalse
 */
function changeTab(
    elements: EditorElements,
    messageData: ContentPeerEditorMessage,
) {
    const isPreview = messageData.subKey === "preview";

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

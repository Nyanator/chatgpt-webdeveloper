import { CrossDispatcher, ElementLoader } from "@nyanator/chrome-ext-utils";
import { EditorElements } from "../editor/editor-element";
import { ContentScriptChannel } from "./content-peer-content";
import { ContentPeerEditorMessage } from "./content-peer-editor";
import { EditorElementToContentDispathcerSender } from "./editor-element-to-content-dispathcer-sender";

/**
 * エディターエレメントのイベントリスナーを実装します。
 */
export class EditorElementEventListener {
    constructor(
        private readonly elementLoader: ElementLoader<EditorElements>,
        private readonly editorCrossDispatcher: CrossDispatcher<ContentScriptChannel>,
        private readonly editorElementToContentDispathcerSender: EditorElementToContentDispathcerSender,
    ) {}

    /**
     * メッセージリスナーを開始します。
     */
    startListener(): void {
        this.elementLoader.addListeners([
            {
                element: "editor",
                events: {
                    load: async () => {
                        await this.editorElementToContentDispathcerSender.dispatchLoadDataRequest();
                        this.elementLoader.elements.loading.remove();
                    },
                },
            },
            {
                element: "copyCodeButton",
                events: {
                    click: () => {
                        this.editorElementToContentDispathcerSender.dispatchClipboardSaveRequest();

                        this.toggleAnimation(true);
                        setTimeout(() => this.toggleAnimation(false), 2000);
                    },
                },
            },
            {
                element: "header",
                events: {
                    doubleClick: () => this.toggleEditor(),
                },
            },
        ]);

        this.editorCrossDispatcher.channel({
            TabChangedEvent: (messageData) => {
                this.changeTab(messageData);
            },
        });
    }

    /**
     * メッセージリスナー停止します。
     */
    stopListener(): void {
        this.elementLoader.removeAllListeners();
        this.editorCrossDispatcher.clear();
    }

    /**
     * タブ変更時処理
     * @param messageData プレビュータブのときのhtmlの内容
     */
    private changeTab(messageData: ContentPeerEditorMessage) {
        const isPreview = messageData.subKey === "preview";

        // z-indexでタブを表現
        if (isPreview) {
            const outerHTML = messageData.message;
            this.elementLoader.elements.preview.srcdoc = outerHTML;
            this.elementLoader.elements.editor.style.transition =
                "z-index 0.3s ease";
            this.elementLoader.elements.preview.style.transition =
                "z-index 0.3s ease";

            this.elementLoader.elements.editor.style.zIndex = "0";
            this.elementLoader.elements.preview.style.zIndex = "10";
            this.elementLoader.elements.preview.style.opacity = "1";
            this.elementLoader.elements.preview.focus();
        } else {
            this.elementLoader.elements.editor.style.zIndex = "10";
            this.elementLoader.elements.preview.style.zIndex = "0";
            this.elementLoader.elements.preview.style.opacity = "0";
        }
    }

    /**
     * Copy Codeボタンのアニメーション効果
     * @param activate コピー中=true,コピー完了false
     */
    private toggleAnimation(activate: boolean): void {
        const style = (elem: SVGPathElement | HTMLSpanElement, value: string) =>
            (elem.style.display = value);

        const displayValues = activate
            ? ["none", "none", "inline", "none", "inline"]
            : ["inline", "inline", "none", "inline", "none"];

        [
            this.elementLoader.elements.copyPath,
            this.elementLoader.elements.copyRect,
            this.elementLoader.elements.copyPolyline,
            this.elementLoader.elements.copyTextBefore,
            this.elementLoader.elements.copyTextAfter,
        ].forEach((elem, index) => {
            style(elem, displayValues[index]);
        });
    }

    /**
     * エディターを開閉します
     */
    private toggleEditor(): void {
        if (this.elementLoader.elements.editor.style.display === "none") {
            this.elementLoader.elements.editor.style.display = "block";
            this.elementLoader.elements.preview.style.display = "block";
            return;
        }

        this.elementLoader.elements.editor.style.display = "none";
        this.elementLoader.elements.preview.style.display = "none";
    }
}

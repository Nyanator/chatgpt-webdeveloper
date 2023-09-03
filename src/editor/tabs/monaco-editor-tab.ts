import { WindowMessageAgent } from "@nyanator/chrome-ext-utils";
import * as monaco from "monaco-editor";

import {
    ContentPeerEditorMessage,
    MSG_KEY_EC,
} from "../../interfaces/content-peer-editor";
import * as ChatGPTUtils from "../../utils/chat-gpt-utils";
import { LANGUAGE_PREFIX } from "../../utils/language-def";

import githubDark from "./MyGitHub Dark.json";
import { Tab } from "./tab";

/** テーマ名 */
const THEME = "mygithubdark";

// Monaco Editor用の環境設定
self.MonacoEnvironment = {
    getWorkerUrl(_, label) {
        if (label === "css" || label === "scss" || label === "less") {
            return chrome.runtime.getURL(
                "monacoeditorwork/css.worker.bundle.js",
            );
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
            return chrome.runtime.getURL(
                "monacoeditorwork/html.worker.bundle.js",
            );
        }
        if (label === "typescript" || label === "javascript") {
            return chrome.runtime.getURL(
                "monacoeditorwork/ts.worker.bundle.js",
            );
        }
        return chrome.runtime.getURL(
            "monacoeditorwork/editor.worker.bundle.js",
        );
    },
};

// テーマを定義
monaco.editor.defineTheme(
    THEME,
    githubDark as monaco.editor.IStandaloneThemeData,
);

/**
 * MonacoEditorを埋め込んだTabの実装です。
 */
export class MonacoEditorTab extends Tab {
    private readonly language: string;
    private readonly editor: monaco.editor.IStandaloneCodeEditor;
    private oldValue: string;

    /**
     * MonacoEditorTab インスタンスを生成します。
     * @param tabElement タブの HTML 要素
     * @param contentElement タブのコンテンツの HTML 要素
     * @param messageAgent メッセージ送受信を管理する MessageAgent インスタンス
     */
    constructor(
        protected readonly tabElement: HTMLElement,
        protected readonly contentElement: HTMLElement,
        protected readonly messageAgent: WindowMessageAgent<ContentPeerEditorMessage>,
    ) {
        super(tabElement, contentElement, messageAgent);

        // エディターの生成
        this.language = this.tabElement.dataset.kind ?? "undef language";
        this.editor = monaco.editor.create(this.contentElement, {
            value: "",
            language: this.language.replace(LANGUAGE_PREFIX, ""),
            minimap: {
                enabled: false,
            },
            mouseWheelZoom: true,
            scrollBeyondLastLine: false,
            theme: THEME,
            automaticLayout: true,
            fontFamily: `"Söhne Mono", Monaco, "Andale Mono", "Ubuntu Mono", monospace`,
            lineHeight: 1.5,
            wordWrap: "on",
        });

        // データが入力されたときに保存
        this.editor.onDidChangeModelContent((e) => {
            if (!e.isFlush) {
                this.saveCodeText();
            }
            this.oldValue = this.getValue();
        });

        // アンロード前に保存
        window.addEventListener("beforeunload", () => {
            this.saveCodeText();
        });
        this.oldValue = "";
    }

    /**
     * エディターの現在のコードを取得します。
     * @returns エディターの現在のコード
     */
    getValue(): string {
        return this.editor.getValue();
    }

    /**
     * エディターのコードを設定します。
     * @param value 設定するコード
     */
    setValue(value: string) {
        const fullRange = this.editor.getModel()?.getFullModelRange();
        if (!fullRange) {
            return;
        }

        // setValue では Undo スタックが消えるため、executeEdits で操作
        this.editor.executeEdits(null, [
            {
                text: value,
                range: fullRange,
            },
        ]);
        this.editor.pushUndoStop();
        this.oldValue = value;
    }

    /**
     * タブがアクティブ化されたときの処理をします。
     */
    async activate() {
        this.saveCodeText();
        super.activate();
        await this.messageAgent.postMessage({
            target: window.parent,
            targetOrigin: ChatGPTUtils.ORIGIN,
            message: {
                runtimeId: chrome.runtime.id,
                key: MSG_KEY_EC.TabChangedEvent,
                message: "tab changed",
            },
        });

        // エディターのフォーカスとレイアウト調整
        setTimeout(() => {
            this.editor.focus();
            this.editor.layout();
        }, 0);
    }

    /**
     * タブが非アクティブ化されたときの処理をします。
     */
    async deactivate() {
        await this.saveCodeText();
        super.deactivate();
    }

    /**
     * エディターのコードを保存します。
     */
    async saveCodeText() {
        const codeText = this.getValue();
        // 入力値が変更された場合のみ Save リクエストを送信
        if (this.oldValue === codeText) {
            return;
        }

        await this.messageAgent.postMessage({
            target: window.parent,
            targetOrigin: ChatGPTUtils.ORIGIN,
            message: {
                runtimeId: chrome.runtime.id,
                key: MSG_KEY_EC.SaveDataRequest,
                subKey: this.language,
                message: codeText,
            },
        });
    }

    /**
     * コンテンツの値をクリップボードに保存します。
     */
    async saveClipboard() {
        await this.saveCodeText();
        await super.saveClipboard();
    }
}

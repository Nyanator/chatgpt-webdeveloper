import * as ChatGPTUtils from "../utils/chat-gpt-utils";

import { ContentToEditorMessageSender } from "./content-to-editor-message-sender";

/**
 * コンテンツスクリプトのイベントリスナーを実装します。
 */
export class ContentEventListener {
    /**
     * ContentEventListenerのインスタンスを初期化します
     * @param contentToTditorMessageSender エディターへのメッセージ送信オブジェクト
     */
    constructor(
        private readonly contentToTditorMessageSender: ContentToEditorMessageSender,
    ) {}

    /**
     * メッセージリスナーを開始します。
     */
    startListening(): void {
        document.addEventListener("click", this.handleWindowClick.bind(this));
    }

    /**
     * メッセージリスナーを停止します。
     */
    stopListening(): void {
        document.removeEventListener("click", this.handleWindowClick);
    }

    /**
     * alt + clickでエディタータブにコードを送信します
     * @param event マウスイベント
     */
    private handleWindowClick = async (event: MouseEvent): Promise<void> => {
        const codeElement = ChatGPTUtils.findCodeElementFromClickElement(event);
        if (!codeElement) {
            return;
        }

        const languageClass = ChatGPTUtils.extractLanguageClass(codeElement);
        if (!languageClass) {
            return;
        }

        this.contentToTditorMessageSender.postTabUpdateRequest({
            subKey: languageClass,
            message: codeElement.textContent ?? "",
        });
    };
}

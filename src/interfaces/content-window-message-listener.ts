import * as ChatGPTUtils from "../utils/chat-gpt-utils";

import { EditorMessageSender } from "./editor-message-sender";

/**
 * コンテンツスクリプトのウィンドウメッセージを実装します。
 */
export class ContentWindowMessageListener {
    /**
     * ContentWindowMessageListenerのインスタンスを初期化します
     * @param editorMessageSender エディターへのメッセージ送信オブジェクト
     */
    constructor(private readonly editorMessageSender: EditorMessageSender) {}

    /**
     * メッセージリスナーを開始します。
     */
    startListening(): void {
        document.addEventListener("click", this.handleWindowClick);
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

        this.editorMessageSender.postTabUpdateRequest({
            subKey: languageClass,
            message: codeElement.textContent ?? "",
        });
    };
}

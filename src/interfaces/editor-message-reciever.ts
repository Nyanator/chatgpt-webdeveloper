import { WindowMessageAgent, assertNotNull } from "@nyanator/chrome-ext-utils";

import { ALERT_MESSAGE_NAME, handleAlertAction } from "../utils/handle-error";

import { BackgroundMessageSender } from "./background-message-sender";
import { ContentPeerEditorMessage, MSG_KEY_EC } from "./content-peer-editor";
import { EditorElementDispathcerSender } from "./editor-element-dispatcher-sender";

/**
 * エディターからのメッセージ受信を実装します。
 */
export class EditorMessageReceiver {
    /**
     * EditorMessageReceiverのインスタンスを初期化します。
     * @param editorMessageAgent エディターからのメッセージ受信エージェント
     * @param backgroundMessageSender バックラウンドへの送信オブジェクト
     * @param editorElementDispathcerSender エディターエレメントへのメッセージディスパッチャー
     */
    constructor(
        private readonly editorMessageAgent: WindowMessageAgent<ContentPeerEditorMessage>,
        private readonly backgroundMessageSender: BackgroundMessageSender,
        private readonly editorElementDispathcerSender: EditorElementDispathcerSender,
    ) {}

    /**
     * メッセージ受信を開始します。
     */
    startListening(): void {
        this.editorMessageAgent.addListener(this.handleEditorMessage);
    }

    /**
     * メッセージ受信を停止します。
     */
    stopListening(): void {
        this.editorMessageAgent.removeListener();
    }

    /**
     * メッセージ分岐処理
     * @param messageData エディターからの受信メッセージ
     */
    private handleEditorMessage = (
        messageData: ContentPeerEditorMessage,
    ): void => {
        switch (messageData.key) {
            case MSG_KEY_EC.ClipboardSaveRequest:
                return this.handleClipboardSaveRequest(messageData);
            case MSG_KEY_EC.SaveDataRequest:
                return this.handleSaveDataRequest(messageData);
            case MSG_KEY_EC.TabChangedEvent:
                this.editorElementDispathcerSender.dispatchTabChangedEvent(
                    messageData,
                );
                return;
        }
    };

    /**
     * クリップボードへ保存
     * @param messageData エディターからの受信メッセージ
     */
    private handleClipboardSaveRequest(
        messageData: ContentPeerEditorMessage,
    ): void {
        const writeText = messageData.message;
        handleAlertAction(async () => {
            await navigator.clipboard.writeText(writeText);
        }, ALERT_MESSAGE_NAME.ClipboardSave);
    }

    /**
     * バックグラウンドへのデータ保存要求
     * @param messageData エディターからの受信メッセージ
     */
    private handleSaveDataRequest(messageData: ContentPeerEditorMessage): void {
        const subKey = assertNotNull(messageData.subKey);
        const message = messageData.message;
        this.backgroundMessageSender.saveDataRequest({ subKey, message });
    }
}

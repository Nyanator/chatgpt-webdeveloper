import { WindowMessageAgent, assertNotNull } from "@nyanator/chrome-ext-utils";

import { ALERT_MESSAGE_NAME, handleAlertAction } from "../utils/handle-error";

import { ContentPeerEditorMessage, MSG_KEY_EC } from "./content-peer-editor";
import { ContentToBackgroundMessageSender } from "./content-to-background-message-sender";
import { ContentToEditorElementDispathcerSender } from "./content-to-editor-element-dispatcher-sender";

/**
 * エディター->コンテンツのメッセージ受信を実装します。
 */
export class EditorToContentMessageReceiver {
    /**
     * EditorToContentMessageReceiverのインスタンスを初期化します。
     * @param editorMessageAgent エディターからのメッセージ受信エージェント
     * @param contentToBackgroundMessageSender バックラウンドへの送信オブジェクト
     * @param editorElementDispathcerSender エディターエレメントへのメッセージディスパッチャー
     */
    constructor(
        private readonly editorMessageAgent: WindowMessageAgent<ContentPeerEditorMessage>,
        private readonly contentToBackgroundMessageSender: ContentToBackgroundMessageSender,
        private readonly contentToEditorElementDispathcerSender: ContentToEditorElementDispathcerSender,
    ) {}

    /**
     * メッセージ受信を開始します。
     */
    startListening(): void {
        this.editorMessageAgent.addListener(
            this.handleEditorMessage.bind(this),
        );
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
                this.contentToEditorElementDispathcerSender.dispatchTabChangedEvent(
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
        this.contentToBackgroundMessageSender.saveDataRequest({
            subKey,
            message,
        });
    }
}

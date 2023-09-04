import { CrossDispatcher, assertNotNull } from "@nyanator/chrome-ext-utils";

import { ContentScriptChannel } from "./content-peer-content";
import { ContentToBackgroundMessageSender } from "./content-to-background-message-sender";
import { ContentToEditorMessageSender } from "./content-to-editor-message-sender";

/**
 * エディターエレメント->コンテンツのディスパッチ受信を実装します。
 */
export class EditorElementToContentDispathcerReceiver {
    /**
     * EditorElementToContentDispathcerReceiverのインスタンスを初期化します。
     * @param editorElementDispathcer エディターエレメントとのメッセージディスパッチャー
     * @param contentToEditorMessageSender エディターへのメッセージ送信オブジェクト
     * @param contentToBackgroundMessageSender バックグラウンドへのメッセージ送信オブジェクト
     */
    constructor(
        private readonly editorElementDispathcer: CrossDispatcher<ContentScriptChannel>,
        private readonly contentToEditorMessageSender: ContentToEditorMessageSender,
        private readonly contentToBackgroundMessageSender: ContentToBackgroundMessageSender,
    ) {}

    /**
     * エディターエレメントとのディスパッチチャンネルを開始します
     */
    startChannel(): void {
        this.editorElementDispathcer.channel({
            ClipboardSaveRequest: this.handleClipboardSaveRequest.bind(this),
            LoadDataRequest: this.handleLoadDataRequest.bind(this),
        });
    }

    /**
     * エディターエレメントとのディスパッチチャンネルを停止します
     */
    stopChannel(): void {
        this.editorElementDispathcer.clear();
    }

    /**
     * クリップボード保存要求のハンドラー
     */
    private handleClipboardSaveRequest = (): void => {
        this.contentToEditorMessageSender.postClipboardSaveRequest();
    };

    /**
     * データ保存要求のハンドラー
     */
    private handleLoadDataRequest = async (subKey: string): Promise<void> => {
        const loadData =
            await this.contentToBackgroundMessageSender.loadDataRequest(subKey);

        if (loadData) {
            this.contentToEditorMessageSender.postLoadedData({
                subKey: assertNotNull(loadData.subKey),
                message: loadData.message,
            });
        }
    };
}

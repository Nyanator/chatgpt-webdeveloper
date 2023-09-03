import { CrossDispatcher, assertNotNull } from "@nyanator/chrome-ext-utils";

import { BackgroundMessageSender } from "./background-message-sender";
import { ContentScriptChannel } from "./content-peer-content";
import { EditorMessageSender } from "./editor-message-sender";

/**
 * エディターエレメントからのディスパッチ受信を実装します。
 */
export class EditorElementDispathcerReceiver {
    /**
     * EditorElementDispathcerSenderのインスタンスを初期化します。
     * @param editorElementDispathcer エディターエレメントとのメッセージディスパッチャー
     * @param editorMessageSender エディターへのメッセージ送信オブジェクト
     * @param backgroundMessageSender バックグラウンドへのメッセージ送信オブジェクト
     */
    constructor(
        private readonly editorElementDispathcer: CrossDispatcher<ContentScriptChannel>,
        private readonly editorMessageSender: EditorMessageSender,
        private readonly backgroundMessageSender: BackgroundMessageSender,
    ) {}

    /**
     * エディターエレメントとのディスパッチチャンネルを開始します
     */
    startChannel(): void {
        this.editorElementDispathcer.channel({
            ClipboardSaveRequest: this.handleClipboardSaveRequest,
            LoadDataRequest: this.handleLoadDataRequest,
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
        this.editorMessageSender.postClipboardSaveRequest();
    };

    /**
     * データ保存要求のハンドラー
     */
    private handleLoadDataRequest = async (subKey: string): Promise<void> => {
        const loadData =
            await this.backgroundMessageSender.loadDataRequest(subKey);

        if (loadData) {
            this.editorMessageSender.postLoadedData({
                subKey: assertNotNull(loadData.subKey),
                message: loadData.message,
            });
        }
    };
}

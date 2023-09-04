import {
    DatabaseAgent,
    RuntimeMessageAgent,
    assertNotNull,
} from "@nyanator/chrome-ext-utils";

import { ALERT_MESSAGE_NAME, handleAlertAction } from "../utils/handle-error";
import {
    ContentPeerBackgroundMessage,
    MSG_KEY_BC,
    MSG_KEY_CB,
} from "./content-peer-background";

/**
 * コンテンツ->バックグラウンドのメッセージ受信を実装します。
 */
export class ContentToBackgroundMessageReceiver {
    /**
     * ContentToBackgroundMessageReceiverのインスタンスを初期化します。
     * @param contentMessageAgent コンテンツとの通信に使うメッセージエージェント
     * @param databaseAgent データベースエージェント
     */
    constructor(
        private readonly contentMessageAgent: RuntimeMessageAgent<ContentPeerBackgroundMessage>,
        private readonly databaseAgent: DatabaseAgent,
    ) {}

    /**
     * メッセージ受信を開始します。
     */
    startListening(): void {
        this.contentMessageAgent.addListener(this.receiveMessage.bind(this));
    }

    /**
     * メッセージ受信を停止します。
     */
    stopListening(): void {
        this.contentMessageAgent.removeListener();
    }

    /**
     * コンテンツからのメッセージを受信し、適切な処理を行います。
     * @param messageData 受信したメッセージデータ
     */
    private async receiveMessage(
        messageData: ContentPeerBackgroundMessage,
    ): Promise<void | ContentPeerBackgroundMessage> {
        switch (messageData.key) {
            case MSG_KEY_CB.ShowHTMLWindowRequest:
                return this.showHTMLPreviewWindow(messageData.message);
            case MSG_KEY_CB.SaveDataRequest:
                return this.saveDatabase(messageData);
            case MSG_KEY_CB.LoadDataRequest:
                return this.loadDatabase(messageData);
        }
    }

    /**
     * HTMLプレビューを表示します。
     * @param htmlText HTML文字列
     */
    private showHTMLPreviewWindow(htmlText: string): void {
        chrome.windows.create({
            url: "data:text/html;charset=utf-8," + encodeURIComponent(htmlText),
            width: 600,
            height: 600,
            type: "panel",
        });
    }

    /**
     * 永続化データベースにデータを保存します。
     * @param messageData 保存するメッセージデータ
     */
    private async saveDatabase(
        messageData: ContentPeerBackgroundMessage,
    ): Promise<void> {
        handleAlertAction(async () => {
            const subKey = assertNotNull(messageData.subKey);
            await this.databaseAgent.save({
                key: subKey,
                data: messageData.message,
            });
        }, ALERT_MESSAGE_NAME.DatabaseSave);
    }

    /**
     * 永続化データベースからデータを読み込みます。
     * @param messageData 読み込むメッセージデータ
     * @returns 読み込んだデータ
     */
    private async loadDatabase(
        messageData: ContentPeerBackgroundMessage,
    ): Promise<ContentPeerBackgroundMessage | undefined> {
        return handleAlertAction(async () => {
            const subKey = assertNotNull(messageData.subKey);
            const result = (await this.databaseAgent.get(subKey)) || "";
            return {
                runtimeId: chrome.runtime.id,
                message: result as string,
                key: MSG_KEY_BC.ReplyLoadedData,
                subKey: messageData.subKey,
            };
        }, ALERT_MESSAGE_NAME.DatabaseLoad);
    }
}

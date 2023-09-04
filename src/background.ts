/**
 * @file バックグラウンドスクリプト
 * Chrome拡張はコンテンツ、バックグラウンド、フレーム(iframe)等のコンテキストで実行されます。
 * バックグラウンドはウェブページの寿命とは別に長期間状態を維持したり、時間がかかる処理を分担します。
 */

import { DatabaseAgent } from "@nyanator/chrome-ext-utils";

import { BackgroundEventListener } from "./interfaces/background-event-listener";
import { BackgroundToContentMessageSender } from "./interfaces/background-to-content-message-sender";
import { ContentToBackgroundMessageReceiver } from "./interfaces/content-to-background-message-receiver";
import * as ChatGPTUtils from "./utils/chat-gpt-utils";
import { ALERT_MESSAGE_NAME, handleAlertAction } from "./utils/handle-error";

export class BackgroundScript {
    /**
     * バックグラウンドスクリプトを初期化します。
     */
    async initialize(): Promise<void> {
        const contentPeerBackgroundMessageAgent =
            await ChatGPTUtils.createRuntimeMessageAgent();

        const databaseAgent = await this.openDatabase();

        // コンテンツ->バックグラウンドの受信を実装
        const contentToBackgroundMessageReceiver =
            new ContentToBackgroundMessageReceiver(
                contentPeerBackgroundMessageAgent,
                databaseAgent,
            );
        contentToBackgroundMessageReceiver.startListening();

        // バックグラウンド->コンテンツのリクエストを実装
        const backgroundToContentMessageSender =
            new BackgroundToContentMessageSender(
                contentPeerBackgroundMessageAgent,
            );

        const backgroundEventListener = new BackgroundEventListener(
            backgroundToContentMessageSender,
        );
        backgroundEventListener.startListener();
    }

    /**
     * 永続化データベースをオープンします。
     */
    private async openDatabase(): Promise<DatabaseAgent> {
        const databaseAgent = DatabaseAgent({
            databaseName: "chatgpt-webdeveloper",
            storeName: "savedata",
        });

        handleAlertAction(async () => {
            await databaseAgent.open();
        }, ALERT_MESSAGE_NAME.DatabaseOpen);

        return databaseAgent;
    }
}

const backgroundScript = new BackgroundScript();
backgroundScript.initialize();

import { RuntimeMessageAgent } from "@nyanator/chrome-ext-utils";

import { handleErrorAction } from "../utils/handle-error";
import {
    ContentPeerBackgroundMessage,
    MSG_KEY_BC,
} from "./content-peer-background";

/**
 * バックグラウンド->コンテンツのリクエストを実装します。
 */
export class BackgroundToContentMessageSender {
    /**
     * BackgroundToContentMessageSenderのインスタンスを初期化します。
     * @param contentMessageAgent コンテンツとの通信に使うメッセージエージェント
     */
    constructor(
        private readonly contentMessageAgent: RuntimeMessageAgent<ContentPeerBackgroundMessage>,
    ) {}

    /**
     * URL変更イベントをコンテンツスクリプトへ送信します。
     * @param tabId タブID
     */
    async notifyURLChanged(tabId: number): Promise<void> {
        handleErrorAction(async () => {
            await this.contentMessageAgent.sendMessage({
                message: {
                    runtimeId: chrome.runtime.id,
                    key: MSG_KEY_BC.UrlUpdatedEvent,
                    message: "",
                },
                tabId: tabId,
            });
        });
    }
}

import * as ChatGPTUtils from "../utils/chat-gpt-utils";
import { BackgroundToContentMessageSender } from "./background-to-content-message-sender";

/**
 * バックグラウンドスクリプトのイベントリスナーを実装します。
 */
export class BackgroundEventListener {
    /**
     * BackgroundEventListenerのインスタンスを初期化します
     * @param backgroundToContentMessageSender コンテンツへのメッセージ送信オブジェクト
     */
    constructor(
        private readonly backgroundToContentMessageSender: BackgroundToContentMessageSender,
    ) {}

    /**
     * メッセージリスナーを開始します。
     */
    startListener(): void {
        chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    }

    /**
     * メッセージリスナー停止します。
     */
    stopListener(): void {
        chrome.tabs.onUpdated.addListener(this.handleTabUpdate);
    }

    /**
     * URL変更イベントをコンテンツスクリプトへ送信します。
     * @param tabId タブID
     * @param changeInfo 変更情報
     * @param tab タブ
     */
    private async handleTabUpdate(
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
        tab: chrome.tabs.Tab,
    ): Promise<void> {
        if (!tab.active || !changeInfo.url) {
            return;
        }

        const tabOrigin = new URL(changeInfo.url).origin;
        if (tabOrigin !== ChatGPTUtils.ORIGIN) {
            return;
        }

        this.backgroundToContentMessageSender.notifyURLChanged(tabId);
    }
}

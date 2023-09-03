/**
 * @file バックグラウンドスクリプト
 * Chrome拡張はコンテンツ、バックグラウンド、フレーム(iframe)等のコンテキストで実行されます。
 * バックグラウンドはウェブページの寿命とは別に長期間状態を維持したり、時間がかかる処理を分担します。
 */

import {
    DatabaseAgent,
    RuntimeMessageAgent,
    assertNotNull,
} from "@nyanator/chrome-ext-utils";

import {
    ContentPeerBackgroundMessage,
    MSG_KEY_BC,
    MSG_KEY_CB,
} from "./interfaces/content-peer-background";
import * as ChatGPTUtils from "./utils/chat-gpt-utils";
import {
    ALERT_MESSAGE_NAME,
    handleAlertAction,
    handleErrorAction,
} from "./utils/handle-error";

initializeBackgroundScript();

/**
 * バックグラウンドスクリプトを初期化します。
 */
async function initializeBackgroundScript(): Promise<void> {
    const contentPeerBackgroundMessageAgent =
        await ChatGPTUtils.createRuntimeMessageAgent();

    const databaseAgent = await openDatabase();

    setupMessageListenersFromContent({
        messageAgent: contentPeerBackgroundMessageAgent,
        databaseAgent,
    });

    setupURLChanedListener(contentPeerBackgroundMessageAgent);
}

/**
 * 永続化データベースをオープンします。
 */
async function openDatabase(): Promise<DatabaseAgent> {
    const databaseAgent = DatabaseAgent({
        databaseName: "chatgpt-webdeveloper",
        storeName: "savedata",
    });

    handleAlertAction(async () => {
        await databaseAgent.open();
    }, ALERT_MESSAGE_NAME.DatabaseOpen);

    return databaseAgent;
}

/**
 * コンテンツスクリプトからの通信を受けるリスナーを設定します。
 * @param messageAgent 受信するメッセージエージェント
 * @param databaseAgent 永続化に使用するエージェント
 */
function setupMessageListenersFromContent(arg: {
    messageAgent: RuntimeMessageAgent<ContentPeerBackgroundMessage>;
    databaseAgent: DatabaseAgent;
}): void {
    arg.messageAgent.addListener(
        async (messageData: ContentPeerBackgroundMessage) => {
            switch (messageData.key) {
                case MSG_KEY_CB.ShowHTMLWindowRequest:
                    return showHTMLPreviewWindow(messageData.message);
                case MSG_KEY_CB.SaveDataRequest:
                    return await saveDatabase({
                        messageData: messageData,
                        databaseAgent: arg.databaseAgent,
                    });
                case MSG_KEY_CB.LoadDataRequest:
                    return await loadDatabase({
                        messageData: messageData,
                        databaseAgent: arg.databaseAgent,
                    });
            }
        },
    );
}

/**
 * URL変更イベントを監視するリスナーを設定します。
 * @param messageAgent 送信用のメッセージエージェント
 */
function setupURLChanedListener(
    messageAgent: RuntimeMessageAgent<ContentPeerBackgroundMessage>,
): void {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (
            !checkNecessaryURLChangedNotify({
                tabId: tabId,
                changeInfo: changeInfo,
                tab: tab,
            })
        ) {
            return;
        }
        notifyURLChanged({
            messageAgent: messageAgent,
            tabId,
        });
    });
}

/**
 * HTMLプレビューを表示します。
 * @param htmlText html文字列
 */
function showHTMLPreviewWindow(htmlText: string): void {
    chrome.windows.create({
        url: "data:text/html;charset=utf-8," + encodeURIComponent(htmlText),
        width: 600,
        height: 600,
        type: "panel",
    });
}

/**
 * 永続化データーベースに保存します。
 * @param messageData 保存したいデータ
 * @param databaseAgent データベースエージェント
 */
async function saveDatabase(arg: {
    messageData: ContentPeerBackgroundMessage;
    databaseAgent: DatabaseAgent;
}): Promise<void> {
    handleAlertAction(async () => {
        const subKey = assertNotNull(arg.messageData.subKey);
        await arg.databaseAgent.save({
            key: subKey,
            data: arg.messageData.message,
        });
    }, ALERT_MESSAGE_NAME.DatabaseSave);
}

/**
 * 永続化データーベースからデータを読み込みます。
 * @param messageData 保存したいデータ
 * @param databaseAgent データベースエージェント
 */
async function loadDatabase(arg: {
    messageData: ContentPeerBackgroundMessage;
    databaseAgent: DatabaseAgent;
}): Promise<ContentPeerBackgroundMessage | undefined> {
    return handleAlertAction(async () => {
        const subKey = assertNotNull(arg.messageData.subKey);
        const result = ((await arg.databaseAgent.get(subKey)) ?? "") as string;
        return {
            runtimeId: chrome.runtime.id,
            message: result,
            key: MSG_KEY_BC.ReplyLoadedData,
            subKey: arg.messageData.subKey,
        };
    }, ALERT_MESSAGE_NAME.DatabaseLoad);
}

/**
 * URLの変更イベントからコンテンツスクリプトへの通知が必要化判定します。
 * @param tabId タブID
 * @param changeInfo 変更情報
 * @param tab タブ
 * @returns 通知が必要な時true それ以外はfalse
 */
function checkNecessaryURLChangedNotify(arg: {
    tabId: number;
    changeInfo: chrome.tabs.TabChangeInfo;
    tab: chrome.tabs.Tab;
}): boolean {
    if (!arg.tab.active || !arg.changeInfo.url) {
        return false;
    }

    const tabOrigin = new URL(arg.changeInfo.url).origin;
    if (tabOrigin !== ChatGPTUtils.ORIGIN) {
        return false;
    }

    return true;
}

/**
 * URL変更イベントをコンテンツスクリプトへ送信します。
 * @param messageAgent 送信用のメッセージエージェント
 */
async function notifyURLChanged(arg: {
    tabId: number;
    messageAgent: RuntimeMessageAgent<ContentPeerBackgroundMessage>;
}): Promise<void> {
    handleErrorAction(async () => {
        await arg.messageAgent.sendMessage({
            message: {
                runtimeId: chrome.runtime.id,
                key: MSG_KEY_BC.UrlUpdatedEvent,
                message: "",
            },
            tabId: arg.tabId,
        });
    });
}

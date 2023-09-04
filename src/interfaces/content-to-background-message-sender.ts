import { RuntimeMessageAgent } from "@nyanator/chrome-ext-utils";

import { ALERT_MESSAGE_NAME, handleAlertAction } from "../utils/handle-error";

import {
    ContentPeerBackgroundMessage,
    MSG_KEY_CB,
} from "./content-peer-background";

/**
 * コンテンツ->バックグランドへのリクエストを実装します。
 */
export class ContentToBackgroundMessageSender {
    /**
     * BackgroundMessageSenderのインスタンスを初期化します。
     * @param backgroundMessageAgent バックグランドとの通信に使うエージェント
     */
    constructor(
        private readonly backgroundMessageAgent: RuntimeMessageAgent<ContentPeerBackgroundMessage>,
    ) {}

    /**
     * データの保存を要求します。
     * @param subKey データの保存先を識別するキー
     * @param message 保存したいメッセージ文字列
     */
    async saveDataRequest(arg: {
        subKey: string;
        message: string;
    }): Promise<void> {
        this.send({
            key: MSG_KEY_CB.SaveDataRequest,
            subKey: arg.subKey,
            message: arg.message,
            alertMessage: ALERT_MESSAGE_NAME.DatabaseSave,
        });
    }

    /**
     * データのロードを要求します。
     * @param subKey データの保存先を識別するキー
     * @returns ロード結果
     */
    async loadDataRequest(
        subKey: string,
    ): Promise<ContentPeerBackgroundMessage | void> {
        return this.send({
            key: MSG_KEY_CB.LoadDataRequest,
            subKey: subKey,
            message: "",
            alertMessage: ALERT_MESSAGE_NAME.DatabaseLoad,
        });
    }

    /**
     * バックラウンドにメッセージを送信します。
     * @param key メッセージのキー
     * @param subKey メッセージのサブキー
     * @param message メッセージ文字列
     * @param alertMessage アラートメッセージの識別名
     * @returns バックグラウンドからの応答
     */
    async send(arg: {
        key: MSG_KEY_CB;
        subKey: string;
        message: string;
        alertMessage: ALERT_MESSAGE_NAME;
    }): Promise<ContentPeerBackgroundMessage | void> {
        return handleAlertAction(async () => {
            return await this.backgroundMessageAgent.sendMessage({
                message: {
                    runtimeId: chrome.runtime.id,
                    key: arg.key,
                    subKey: arg.subKey,
                    message: arg.message,
                },
            });
        }, arg.alertMessage);
    }
}

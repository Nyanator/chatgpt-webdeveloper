import {
    EXT_ORIGIN,
    WindowMessageAgent,
    assertNotNull,
} from "@nyanator/chrome-ext-utils";

import { ALERT_MESSAGE_NAME, handleAlertAction } from "../utils/handle-error";

import { ContentPeerEditorMessage, MSG_KEY_CE } from "./content-peer-editor";

/**
 * エディターへのリクエストを実装します。
 */
export class EditorMessageSender {
    /**
     * EditorMessageSenderのインスタンスを初期化します。
     * @param editorMessageAgent エディターとの通信に使うエージェント
     * @param editorFrame 送信先のエディターフレーム
     */
    constructor(
        private readonly editorMessageAgent: WindowMessageAgent<ContentPeerEditorMessage>,
        private readonly editorFrame: HTMLIFrameElement,
    ) {}

    /**
     * クリップボードの保存要求を送信します。
     */
    async postClipboardSaveRequest(): Promise<void> {
        await this.post({
            key: MSG_KEY_CE.ClipboardSaveRequest,
            subKey: undefined,
            message: "",
            alertMessage: ALERT_MESSAGE_NAME.ClipboardSave,
        });
    }

    /**
     * タブ更新要求を送信します。
     * @param subKey タブを識別するキー
     * @param message タブに設定するテキスト
     */
    async postTabUpdateRequest(arg: {
        subKey: string;
        message: string;
    }): Promise<void> {
        await this.post({
            key: MSG_KEY_CE.TabUpdateRequest,
            subKey: arg.subKey,
            message: arg.message,
            alertMessage: ALERT_MESSAGE_NAME.TabUpdate,
        });
    }

    /**
     * ロード済みのデータをエディターに送信します。
     * @param subKey タブを識別するキー
     * @param message タブに設定するテキスト
     */
    async postLoadedData(arg: {
        subKey: string;
        message: string;
    }): Promise<void> {
        await this.post({
            key: MSG_KEY_CE.ReplyLoadedData,
            subKey: arg.subKey,
            message: arg.message,
            alertMessage: ALERT_MESSAGE_NAME.DatabaseLoad,
        });
    }

    /**
     * エディターにメッセージを送信します。
     * @param key メッセージのキー
     * @param subKey メッセージのサブキー
     * @param message メッセージ文字列
     * @param alertMessage アラートメッセージの識別名
     */
    async post(arg: {
        key: MSG_KEY_CE;
        subKey: string | undefined;
        message: string;
        alertMessage: ALERT_MESSAGE_NAME;
    }): Promise<void> {
        handleAlertAction(async () => {
            const targetWindow = assertNotNull(this.editorFrame.contentWindow);
            await this.editorMessageAgent.postMessage({
                target: targetWindow,
                targetOrigin: EXT_ORIGIN,
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

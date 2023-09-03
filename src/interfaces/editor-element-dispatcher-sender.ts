import { CrossDispatcher } from "@nyanator/chrome-ext-utils";

import { ALERT_MESSAGE_NAME, handleAlertAction } from "../utils/handle-error";

import { ContentScriptChannel } from "./content-peer-content";
import { ContentPeerEditorMessage } from "./content-peer-editor";

/**
 * エディターエレメントへのディスパッチ送信を実装します。
 */
export class EditorElementDispathcerSender {
    /**
     * EditorElementDispathcerSenderのインスタンスを初期化します。
     * @param editorElementDispathcer エディターエレメントとのメッセージディスパッチャー
     */
    constructor(
        private readonly editorElementDispathcer: CrossDispatcher<ContentScriptChannel>,
    ) {}

    /**
     * エディター要素にタブ変更イベントを通知します。
     * @param messageData メッセージデータ
     * @param cotext コンテキストオブジェクト
     */
    async dispatchTabChangedEvent(
        messageData: ContentPeerEditorMessage,
    ): Promise<void> {
        handleAlertAction(async () => {
            await this.editorElementDispathcer.dispatch({
                channelKey: "TabChangedEvent",
                channelData: messageData,
            });
        }, ALERT_MESSAGE_NAME.DispathTabChangedEvent);
    }
}

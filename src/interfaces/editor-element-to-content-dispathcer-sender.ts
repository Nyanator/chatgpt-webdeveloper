import { CrossDispatcher } from "@nyanator/chrome-ext-utils";

import { ALERT_MESSAGE_NAME, handleAlertAction } from "../utils/handle-error";
import { PREFIEXED_LANGUAGE } from "../utils/language-def";
import { ContentScriptChannel } from "./content-peer-content";

/**
 * エディターエレメント->コンテンツのディスパッチ送信を実装します。
 */
export class EditorElementToContentDispathcerSender {
    /**
     * ContentToEditorElementDispathcerSenderのインスタンスを初期化します。
     * @param editorCrossDispathcer エディターエレメントとのメッセージディスパッチャー
     */
    constructor(
        private readonly editorCrossDispathcer: CrossDispatcher<ContentScriptChannel>,
    ) {}

    /**
     * コンテンツにロードリクエストイベントを通知します。
     */
    async dispatchLoadDataRequest(): Promise<void> {
        handleAlertAction(async () => {
            await this.editorCrossDispathcer.dispatch({
                channelKey: "LoadDataRequest",
                channelData: PREFIEXED_LANGUAGE.HTML,
            });
            await this.editorCrossDispathcer.dispatch({
                channelKey: "LoadDataRequest",
                channelData: PREFIEXED_LANGUAGE.JS,
            });
            await this.editorCrossDispathcer.dispatch({
                channelKey: "LoadDataRequest",
                channelData: PREFIEXED_LANGUAGE.CSS,
            });
        }, ALERT_MESSAGE_NAME.DatabaseLoad);
    }

    /**
     * コンテンツにクリップボード保存イベントを通知します。
     */
    async dispatchClipboardSaveRequest(): Promise<void> {
        handleAlertAction(async () => {
            await this.editorCrossDispathcer.dispatch({
                channelKey: "ClipboardSaveRequest",
                channelData: undefined,
            });
        }, ALERT_MESSAGE_NAME.ClipboardSave);
    }
}

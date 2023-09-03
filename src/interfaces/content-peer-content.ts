import { ChannelMap } from "@nyanator/chrome-ext-utils";

import { ContentPeerEditorMessage } from "./content-peer-editor";

/** コンテンツスクリプト内でのオブジェクトのメッセージチャンネル定義 */
export interface ContentScriptChannel extends ChannelMap {
    ClipboardSaveRequest: {
        readonly data: void;
        readonly response: void;
    };
    LoadDataRequest: {
        readonly data: string;
        readonly response: void;
    };
    TabChangedEvent: {
        readonly data: ContentPeerEditorMessage;
        readonly response: void;
    };
}

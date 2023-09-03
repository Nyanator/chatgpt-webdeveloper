import { MessageData } from "@nyanator/chrome-ext-utils";

/** メッセージキー(コンテンツ->エディター) */
export const MSG_KEY_CE = {
    ClipboardSaveRequest: "ClipboardSaveRequest",
    TabUpdateRequest: "TabUpdateRequest",
    ReplyLoadedData: "ReplyLoadedData",
} as const;

export type MSG_KEY_CE = (typeof MSG_KEY_CE)[keyof typeof MSG_KEY_CE];

/** メッセージキー(エディター->コンテンツ) */
export const MSG_KEY_EC = {
    ClipboardSaveRequest: "ClipboardSaveRequest",
    SaveDataRequest: "SaveDataRequest",
    TabChangedEvent: "TabChangedEvent",
} as const;

export type MSG_KEY_EC = (typeof MSG_KEY_EC)[keyof typeof MSG_KEY_EC];

/** コンテンツ<->エディター間の通信インターフェース */
export interface ContentPeerEditorMessage extends MessageData {
    /**
     * メッセージキー
     */
    readonly key: MSG_KEY_CE | MSG_KEY_EC;
    /**
     * サブキー
     */
    readonly subKey?: string;
}

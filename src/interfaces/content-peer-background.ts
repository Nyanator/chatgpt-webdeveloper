import { MessageData } from "@nyanator/chrome-ext-utils";

/** メッセージキー(コンテンツ->バックグラウンド) */
export const MSG_KEY_CB = {
    ShowHTMLWindowRequest: "ShowHTMLWindowRequest",
    SaveDataRequest: "SaveDataRequest",
    LoadDataRequest: "LoadDataRequest",
} as const;

export type MSG_KEY_CB = (typeof MSG_KEY_CB)[keyof typeof MSG_KEY_CB];

/** メッセージキー(バックグラウンド->コンテンツ) */
export const MSG_KEY_BC = {
    UrlUpdatedEvent: "UrlUpdatedEvent",
    ReplyLoadedData: "ReplyLoadedData",
} as const;

export type MSG_KEY_BC = (typeof MSG_KEY_BC)[keyof typeof MSG_KEY_BC];

/** コンテンツ<->バックグラウンド間の通信インターフェース */
export interface ContentPeerBackgroundMessage extends MessageData {
    /**
     * メッセージキー
     */
    readonly key: MSG_KEY_CB | MSG_KEY_BC;
    /**
     * サブキー
     */
    readonly subKey?: string;
}

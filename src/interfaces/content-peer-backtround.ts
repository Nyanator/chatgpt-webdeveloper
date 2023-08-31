import { MessageData } from "@nyanator/chrome-ext-utils";

/** メッセージキー(コンテンツ->バックグラウンド) */
export const MSG_KEY_CB = {
  ShowHTMLWindowRequest: "showhtmlwindow:",
  SaveDataRequest: "savedatarequest:",
  LoadDataRequest: "loaddatarequest:",
} as const;

export type MSG_KEY_CB = (typeof MSG_KEY_CB)[keyof typeof MSG_KEY_CB];

/** メッセージキー(バックグラウンド->コンテンツ) */
export const MSG_KEY_BC = {
  UrlUpdatedEvent: "urlupdatedEvent:",
  ReplyLoadedData: "loadeddata:",
} as const;

export type MSG_KEY_BC = (typeof MSG_KEY_BC)[keyof typeof MSG_KEY_BC];

/** コンテンツ->バックグラウンド間の通信インターフェース */
export interface ContentToBackgroundMessage extends MessageData {
  /**
   * メッセージキー
   */
  key: MSG_KEY_CB;
  /**
   * サブキー
   */
  subKey?: string;
}

/** バックグラウンド->コンテンツ間の通信インターフェース */
export interface BackgroundToContentMessage extends MessageData {
  /**
   * メッセージキー
   */
  key: MSG_KEY_BC;
  /**
   * サブキー
   */
  subKey?: string;
}

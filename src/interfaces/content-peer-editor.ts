import { MessageData } from "@nyanator/chrome-ext-utils";

/** メッセージキー(コンテンツ->エディター) */
export const MSG_KEY_CE = {
  ClipboardSaveRequest: "clipboardsaverequest:",
  TabUpdateRequest: "tabupdaterequest:",
} as const;

export type MSG_KEY_CE = (typeof MSG_KEY_CE)[keyof typeof MSG_KEY_CE];

/** メッセージキー(エディター->コンテンツ) */
export const MSG_KEY_EC = {
  ClipboardSaveRequest: "clipboardsaverequest:",
  SaveDataRequest: "savedatarequest:",
  TabChangedEvent: "tabchangedevent:",
} as const;

export type MSG_KEY_EC = (typeof MSG_KEY_EC)[keyof typeof MSG_KEY_EC];

/** コンテンツ->エディター間の通信インターフェース */
export interface ContentToEditorMessage extends MessageData {
  /**
   * メッセージキー
   */
  key: MSG_KEY_CE;
  /**
   * サブキー
   */
  subKey?: string;
}

/** エディター->コンテンツ間の通信インターフェース */
export interface EditorToContentMessage extends MessageData {
  /**
   * メッセージキー
   */
  key: MSG_KEY_EC;
  /**
   * サブキー
   */
  subKey?: string;
}

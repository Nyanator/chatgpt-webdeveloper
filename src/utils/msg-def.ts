/** メッセージ種別 */
export const MSG_CHANNEL = {
  ClipboardSave: "ClipboardSave",
  DatabaseOpen: "DatabaseOpen",
  DatabaseSave: "DatabaseSave",
  DatabaseLoad: "DatabaseLoad",
  EditorLoaded: "EditorLoaded",
  ShowPreview: "ShowPreview",
  TabChangedEvent: "TabChangedEvent",
  TabUpdate: "TabUpdate",
  URLUpdated: "URLUpdated",
} as const;

export type MESSAGE_TYPE = (typeof MSG_CHANNEL)[keyof typeof MSG_CHANNEL];

/** 言語 */
export const LANGUAGE = {
  HTML: "html",
  CSS: "css",
  JAVASCRIPT: "javascript",
} as const;

export type LANGUAGE = (typeof LANGUAGE)[keyof typeof LANGUAGE];

/** プリフィックス付き言語 */
export const LANGUAGE_PREFIX = "language-";
export const PREFIEXED_LANGUAGE = {
  HTML: LANGUAGE_PREFIX + "html",
  CSS: LANGUAGE_PREFIX + "css",
  JS: LANGUAGE_PREFIX + "javascript",
  PREVIEW: LANGUAGE_PREFIX + "preview",
} as const;

export type PREFIEXED_LANGUAGE = (typeof PREFIEXED_LANGUAGE)[keyof typeof PREFIEXED_LANGUAGE];

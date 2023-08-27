import { MessageDataObject } from "@nyanator/chrome-ext-utils";

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
  JAVASCRIPT: LANGUAGE_PREFIX + "javascript",
} as const;

export type PREFIEXED_LANGUAGE =
  (typeof PREFIEXED_LANGUAGE)[keyof typeof PREFIEXED_LANGUAGE];

/** メッセージ種別 */
export const MSG_KIND = {
  TabChanged: "tabchanged:",
  TabUpdate: "tabupdate:",
  ShowHTMLWindow: "showhtmlwindow:",
  Save: "save:",
  Load: "load:",
  Clipboard: "clipboard:",
  UrlUpdated: "urlupdated:",
} as const;

export type MSG_KIND = (typeof MSG_KIND)[keyof typeof MSG_KIND];

/** メッセージサブ種別 */
export const MSG_SUBKIND = {
  HTML: PREFIEXED_LANGUAGE.HTML,
  CSS: PREFIEXED_LANGUAGE.CSS,
  JAVASCRIPT: PREFIEXED_LANGUAGE.JAVASCRIPT,
  PREVIEW: "preview",
} as const;

export type MSG_SUBKIND = (typeof MSG_SUBKIND)[keyof typeof MSG_SUBKIND];

/** メッセージオブジェクト */
export interface KindMessageDataObject extends MessageDataObject {
  /**
   * メッセージ種別
   */
  readonly kind: MSG_KIND;
  /**
   * メッセージサブ種別
   */
  readonly subKind: MSG_SUBKIND | undefined;
}

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
} as const;

export type PREFIEXED_LANGUAGE =
    (typeof PREFIEXED_LANGUAGE)[keyof typeof PREFIEXED_LANGUAGE];

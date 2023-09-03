import {
    EXT_ORIGIN,
    RuntimeMessageAgent,
    WindowMessageAgent,
    findMatchParent,
    findParentPreElement,
    waitForAction,
} from "@nyanator/chrome-ext-utils";
import { ContentPeerBackgroundMessage } from "interfaces/content-peer-background";
import { ContentPeerEditorMessage } from "interfaces/content-peer-editor";

import { LANGUAGE_PREFIX } from "./language-def";

/** Chat GPTのURLオリジン */
export const ORIGIN = "https://chat.openai.com";

/**
 * Chat GPTが読み込まれたタイミングで実行するアクションを予約します。
 * チャット履歴のボタンから過去履歴を読み込むタイミングにアクションを予約するのに使用します。
 * @param action 実行されるアクション
 * @param timeout タイムアウトまでの待機時間（ミリ秒）デフォルトは 30 ミリ秒です
 * @param maxCheck 最大チェック回数デフォルトは 6000 回です
 * @returns アクション実行後に解決されるプロミス
 */
export const reserveLoadedAction = async (
    action: {
        (): void;
    },
    timeout: number = 30,
    maxCheck: number = 6000,
): Promise<void> => {
    return waitForAction(
        action,
        () => {
            // DOMが動的に生成されるため特定要素を監視
            const group = document.body.querySelector("div .group.w-full");
            return group != null;
        },
        timeout,
        maxCheck,
    );
};

/**
 * Chat GPTのInput Formを探します。
 * @returns インプットフォーム
 */
export const findInputForm = (): HTMLDivElement | null => {
    const formDiv = document.querySelector<HTMLDivElement>(
        "div .absolute.bottom-0.left-0.w-full",
    );
    return formDiv;
};

/**
 * Chat GPTのNew Chatボタンを探します。
 * @returns Chat GPTのNew chatボタン
 */
export const findNewChatButton = (): HTMLAnchorElement | undefined => {
    const buttons = Array.from(document.body.querySelectorAll("a"));
    const newChatButton = buttons.find((button) =>
        button.innerHTML.includes("New chat"),
    );
    return newChatButton;
};

/**
 * codeタグから親方向に遡りコードブロックを探します。
 * @param codeElement codeタグ要素
 */
export const findCodeBlockDivFromCodeElement = (
    codeElement: HTMLElement,
): HTMLDivElement => {
    const codeBlockDiv = findMatchParent(
        codeElement,
        ".rounded-md.mb-4",
    ) as HTMLDivElement;
    return codeBlockDiv;
};

/**
 * クリックした要素からコード要素を探します。
 * @param codeElement codeタグ要素
 */
export const findCodeElementFromClickElement = (
    event: MouseEvent,
): Element | null => {
    if (!(event.target instanceof HTMLElement) || !event.altKey) {
        return null;
    }

    const preElement = findParentPreElement(event.target);
    const codeElement = preElement?.querySelectorAll(
        `[class*="${LANGUAGE_PREFIX}"]`,
    );
    if (!codeElement) {
        return null;
    }

    return codeElement[0];
};

/**
 * 要素から言語クラスを抽出します。
 * @param element 要素
 */
export const extractLanguageClass = (element: Element): string => {
    const languageClasses = Array.from(element.classList).filter((className) =>
        className.startsWith(LANGUAGE_PREFIX),
    );
    return languageClasses[0] || "";
};

/**
 * バックグラウンドスクリプトとの通信に使うエージェントを初期化します。
 */
export const createRuntimeMessageAgent = async (): Promise<
    RuntimeMessageAgent<ContentPeerBackgroundMessage>
> => {
    return RuntimeMessageAgent<ContentPeerBackgroundMessage>({
        messageValidatorManagerConfig: {
            messageValidatorConfig: {
                runtimeId: chrome.runtime.id,
                allowedOrigins: [ORIGIN, EXT_ORIGIN],
            },
        },
    });
};

/**
 * エディターとの通信に使うエージェントを初期化します。
 */
export const createWindowMessageAgent = async (): Promise<
    WindowMessageAgent<ContentPeerEditorMessage>
> => {
    return WindowMessageAgent<ContentPeerEditorMessage>({
        messageValidatorManagerConfig: {
            messageValidatorConfig: {
                runtimeId: chrome.runtime.id,
                allowedOrigins: [ORIGIN, EXT_ORIGIN],
            },
        },
    });
};

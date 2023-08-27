import { findMatchParent, waitForAction } from "@nyanator/chrome-ext-utils";

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
export const findCodeBlockDivFromCodeElement = (codeElement: HTMLElement) => {
  const codeBlockDiv = findMatchParent(
    codeElement,
    ".rounded-md.mb-4",
  ) as HTMLDivElement;
  return codeBlockDiv;
};

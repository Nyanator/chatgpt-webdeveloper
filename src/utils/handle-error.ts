import { Logger } from "@nyanator/chrome-ext-utils";

/** 通知エラーメッセージ */
export const ALERT_MESSAGE_NAME = {
    DatabaseOpen: "DatabaseOpen",
    DatabaseSave: "DatabaseSave",
    DatabaseLoad: "DatabaseLoad",
    DispathTabChangedEvent: "DispatchTabChangedEvent",
    ClipboardSave: "ClipboardSave",
    TabUpdate: "TabUpdate",
} as const;

export type ALERT_MESSAGE_NAME =
    (typeof ALERT_MESSAGE_NAME)[keyof typeof ALERT_MESSAGE_NAME];

/** エラーハンドリング関数の引数 */
export type handleAlertParam = {
    /** エラーオブジェクト */
    error: unknown;
    /** message.jsonの識別名 */
    messageName: ALERT_MESSAGE_NAME;
};

/**
 * 多言語対応のエラー通知。message.jsonの識別名からalertを表示します。
 * 例外は再スローするため、復帰が必要な処理には使えません。
 * @param error スローされたオブジェクト
 * @param messageName mesage.jsonの識別名
 */
export const handleAlert = (param: handleAlertParam): void => {
    const alertMessage = chrome.i18n.getMessage(param.messageName);
    if (alert) {
        alert(alertMessage);
        const logger = Logger();
        logger.error(alertMessage);
    }
    handleError(param.error);
};

/**
 * 例外を型安全にロギングします。
 * 例外は再スローするため、復帰が必要な処理には使えません。
 * @param error スローされたオブジェクト
 */
export const handleError = (error: unknown): void => {
    const logger = Logger();
    if (error instanceof Error) {
        logger.error(error.name);
        logger.error(error.stack ?? "");
        logger.error(error.message);
        throw error;
    }
    const errorMessage = "unexcepted error type";
    logger.error(errorMessage, error);
    throw new Error(errorMessage);
};

/**
 * パラメータで渡されたアクションを実行し、エラーが発生した場合は、指定されたメッセージ名でアラートを表示します。
 * @param action 実行するアクション
 * @param messageName エラー発生時に表示するメッセージの名前
 */
export const handleErrorAction = async <T>(
    action: () => Promise<T | undefined>,
): Promise<T | undefined> => {
    try {
        return await action();
    } catch (error) {
        handleError(error);
    }
};

/**
 * パラメータで渡されたアクションを実行し、エラーが発生した場合は、エラーをロギングします。
 * @param action 実行するアクション
 */
export const handleAlertAction = async <T>(
    action: () => Promise<T | undefined>,
    messageName: ALERT_MESSAGE_NAME,
): Promise<T | undefined> => {
    try {
        return await action();
    } catch (error) {
        handleAlert({ error, messageName });
    }
};

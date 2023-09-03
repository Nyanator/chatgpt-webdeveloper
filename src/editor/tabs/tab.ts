import { WindowMessageAgent } from "@nyanator/chrome-ext-utils";

import {
    ContentPeerEditorMessage,
    MSG_KEY_EC,
} from "../../interfaces/content-peer-editor";
import * as ChatGPTUtils from "../../utils/chat-gpt-utils";

/** タブがアクティブ状態を示すクラス名 */
export const ACTIVE = "active";

/**
 * タブの抽象クラスです。
 */
export abstract class Tab {
    /**
     * タブのコンストラクタです。
     * @param tabElement タブ要素
     * @param contentElement コンテンツ要素
     * @param messageAgent メッセージ送受信を管理する MessageAgent インスタンス
     */
    constructor(
        protected readonly tabElement: HTMLElement,
        protected readonly contentElement: HTMLElement,
        protected readonly messageAgent: WindowMessageAgent<ContentPeerEditorMessage>,
    ) {}

    /**
     * コンテンツの値を取得します。
     * @returns コンテンツの値
     */
    abstract getValue(): string;

    /**
     * コンテンツの値を設定します。
     * @param value 設定する値
     */
    abstract setValue(value: string): void;

    /**
     * タブがアクティブ状態かどうかを判定します。
     * @returns タブがアクティブ状態の場合 true、そうでない場合 false
     */
    isActive(): boolean {
        return this.tabElement.classList.contains(ACTIVE);
    }

    /**
     * タブをアクティブ状態にします。
     */
    activate() {
        this.tabElement.classList.add(ACTIVE);
        this.contentElement.classList.add(ACTIVE);
    }

    /**
     * タブを非アクティブ状態にします。
     */
    deactivate() {
        this.tabElement.classList.remove(ACTIVE);
        this.contentElement.classList.remove(ACTIVE);
    }

    /**
     * コンテンツの値をクリップボードに保存します。
     */
    async saveClipboard() {
        const saveText = this.getValue();
        await this.messageAgent.postMessage({
            target: window.parent,
            targetOrigin: ChatGPTUtils.ORIGIN,
            message: {
                runtimeId: chrome.runtime.id,
                key: MSG_KEY_EC.ClipboardSaveRequest,
                message: saveText,
            },
        });
    }
}

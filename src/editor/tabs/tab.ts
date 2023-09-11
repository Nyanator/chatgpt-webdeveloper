import { AlertNamedError, WindowMessageAgent } from "@nyanator/chrome-ext-utils";

import * as ChatGPTUtils from "../../utils/chat-gpt-utils";
import { MSG_CHANNEL } from "../../utils/msg-def";

/** タブがアクティブ状態を示すクラス名 */
export const ACTIVE = "active";

/**
 * タブの抽象クラスです。
 */
export abstract class Tab {
  constructor(
    protected readonly tabElement: HTMLElement,
    protected readonly contentElement: HTMLElement,
    protected readonly messageAgent: WindowMessageAgent,
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
  activate(): void {
    this.tabElement.classList.add(ACTIVE);
    this.contentElement.classList.add(ACTIVE);
  }

  /**
   * タブを非アクティブ状態にします。
   */
  deactivate(): void {
    this.tabElement.classList.remove(ACTIVE);
    this.contentElement.classList.remove(ACTIVE);
  }

  /**
   * コンテンツの値をクリップボードに保存します。
   */
  async saveClipboard(): Promise<void> {
    const saveText = this.getValue();

    try {
      await this.messageAgent.postMessage(window.parent, ChatGPTUtils.ORIGIN, MSG_CHANNEL.ClipboardSave, {
        message: saveText,
      });
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.ClipboardSave, error);
    }
  }
}

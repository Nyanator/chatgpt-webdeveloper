/**
 * バックグラウンドワーカー
 * バックグラウンドでコンテンツからのメッセージ通知を受けたり、必要なイベントの通知を行います。
 * 名前の意味する範囲が広いので、将来的に責務過多になる可能性があります。
 * その際には名前を付けなおしてリファクタリングしてください。
 */
import {
  AlertNamedError,
  DatabaseAgent,
  MessageData,
  RuntimeMessageAgent,
  assertNotNull,
} from "@nyanator/chrome-ext-utils";
import { inject, injectable } from "tsyringe";

import * as ChatGPTUtils from "./utils/chat-gpt-utils";
import { MSG_CHANNEL } from "./utils/msg-def";

@injectable()
export class BackgroundWorker {
  constructor(
    @inject("DatabaseAgent") readonly databaseAgent: DatabaseAgent,
    @inject("RuntimeMessageAgent") readonly messageAgent: RuntimeMessageAgent,
  ) {}

  /** 初期化処理。*/
  async initialize(): Promise<void> {
    await this.openDatabase();

    // イベントやメッセージのハンドラを設定
    this.messageAgent.addListener(MSG_CHANNEL.DatabaseSave, this.saveData.bind(this));
    this.messageAgent.addListener(MSG_CHANNEL.DatabaseLoad, this.loadData.bind(this));
    this.messageAgent.addListener(MSG_CHANNEL.ShowPreview, this.showPreview.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
  }

  /** データベースを開きます。*/
  async openDatabase(): Promise<void> {
    try {
      await this.databaseAgent.open();
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.DatabaseOpen, error);
    }
  }

  /**
   * データベースへ保存します。
   * @param messageData 保存要求
   */
  async saveData(messageData: MessageData): Promise<void> {
    try {
      const key = assertNotNull(messageData.key);
      await this.databaseAgent.save(key, messageData.message);
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.DatabaseSave, error);
    }
  }

  /**
   * データベースから読み込みます。
   * @param messageData 読み込み要求
   * @returns 読み込んだデータ
   */
  async loadData(messageData: MessageData): Promise<MessageData | undefined> {
    try {
      const key = assertNotNull(messageData.key);
      const result = (await this.databaseAgent.get(key)) || "";
      if (typeof result !== "string") {
        throw new TypeError("result type is not string");
      }

      return {
        runtimeId: chrome.runtime.id,
        message: result,
        key: key,
      };
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.DatabaseLoad, error);
    }
  }

  /**
   * HTMLプレビューウィンドウを表示します。
   * @param messageData ウィンドウの表示要求
   */
  showPreview(messageData: MessageData): void {
    const HTML_WINDOW_WIDTH = 600;
    const HTML_WINDOW_HEIGHT = 600;

    chrome.windows.create({
      url: "data:text/html;charset=utf-8," + encodeURIComponent(messageData?.message ?? ""),
      width: HTML_WINDOW_WIDTH,
      height: HTML_WINDOW_HEIGHT,
      type: "panel",
    });
  }

  /**
   * URL変更イベントをコンテンツスクリプトへ送信します。
   * @param tabId タブID
   * @param changeInfo 変更情報
   * @param tab タブ
   */
  async handleTabUpdate(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.active || !changeInfo.url) {
      return;
    }

    const tabOrigin = new URL(changeInfo.url).origin;
    if (tabOrigin !== ChatGPTUtils.ORIGIN) {
      return;
    }

    try {
      await this.messageAgent.sendMessage(MSG_CHANNEL.URLUpdated, {}, tabId);
    } catch (error) {
      throw new AlertNamedError(MSG_CHANNEL.URLUpdated, error);
    }
  }
}

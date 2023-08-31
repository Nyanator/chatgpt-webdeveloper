import { TypedChannelMap } from "@nyanator/chrome-ext-utils";

/** コンテンツスクリプト内でのオブジェクトのメッセージチャンネル定義 */
export interface ContentScriptChannel extends TypedChannelMap {
  loadDataRequest: {
    readonly data: string; // 取得したいデータベースのキー
    readonly response: string; // 取得結果
  };
}

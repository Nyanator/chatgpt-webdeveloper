/**
 * バックグラウンドスクリプトエントリーポイント
 * Chrome拡張はコンテンツ、バックグラウンド、フレーム(iframe)等のコンテキストで実行されます。
 * バックグラウンドはウェブページの寿命とは別に長期間状態を維持したり、時間がかかる処理を分担します。
 */
import { EXT_ORIGIN, ErrorObserver, initializeDIContainer } from "@nyanator/chrome-ext-utils";
import { container } from "tsyringe";

import { BackgroundWorker } from "./background-worker";
import * as ChatGPTUtils from "./utils/chat-gpt-utils";

// DIコンテナの初期化
initializeDIContainer({
  databaseName: "chat gpt web developer",
  storeName: "editor save data",
  allowedOrigins: [EXT_ORIGIN, ChatGPTUtils.ORIGIN],
});

// グローバルエラー監視を有効に
const errorObserver = container.resolve<ErrorObserver>("ErrorObserver");
errorObserver.observe();

// バックグランドワーカーをシングルトンで登録する
container.registerSingleton("BackgroundWorker", BackgroundWorker);
const worker = container.resolve<BackgroundWorker>("BackgroundWorker");

worker.initialize();

/**
 * コードエディターエントリーポイント
 * CSP制約に引っかかるため、Monaco Editorを動作させるためにiframeを使用する
 */
import {
  EXT_ORIGIN,
  ErrorObserver,
  initializeDIContainer,
  reserveLoadedAction,
} from "@nyanator/chrome-ext-utils";
import { container } from "tsyringe";

import { ORIGIN } from "../utils/chat-gpt-utils";

import { CodeEditorTab } from "./code-editor-tabs";

initializeDIContainer({
  allowedOrigins: [EXT_ORIGIN, ORIGIN],
});

// グローバルエラー監視を有効に
const errorObserver = container.resolve<ErrorObserver>("ErrorObserver");
errorObserver.observe();

reserveLoadedAction(document, async () => {
  await resolveCodeEditorTabDependency();
});

/** コードエディタータブの依存関係を解決します */
async function resolveCodeEditorTabDependency() {
  container.registerSingleton("CodeEditorTab", CodeEditorTab);
  const editor = container.resolve<CodeEditorTab>("CodeEditorTab");
  editor.initialize();
}

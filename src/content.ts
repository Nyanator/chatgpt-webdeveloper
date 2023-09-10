/**
 * コンテンツスクリプトエントリーポイント
 * Chrome拡張はコンテンツ、バッググラウンド、フレーム(iframe)等のコンテキストで実行されます。
 * DOMへのアクセスはウェブページに挿入されるコンテンツスクリプトが担います。
 */
import {
  EXT_ORIGIN,
  ElementLoader,
  ErrorObserver,
  appendElementToHead,
  appendStyleTextToHead,
  htmlTextToHtmlElement,
  initializeDIContainer,
  loadResourceText,
  reserveLoadedAction,
} from "@nyanator/chrome-ext-utils";
import { container } from "tsyringe";

import { EditorElement, EditorElementsMap } from "./editor-element";
import { HTMLPreview } from "./preview/html-preview";
import { ORIGIN } from "./utils/chat-gpt-utils";

initializeDIContainer({
  allowedOrigins: [EXT_ORIGIN, ORIGIN],
});

// グローバルエラー監視を有効に
const errorObserver = container.resolve<ErrorObserver>("ErrorObserver");
errorObserver.observe();

reserveLoadedAction(document, async () => {
  await resolveEditorElementDependency();
  await resolveHTMLPreviewDependency();
});

/** エディター要素の依存関係を解決します */
async function resolveEditorElementDependency() {
  // CSSやスタイルの設定
  const EDITOR_ELEMENT_CSS = "editor-element.css";
  const cssText = await loadResourceText(EDITOR_ELEMENT_CSS);
  appendStyleTextToHead(document.body, cssText);

  const STYLES_HTML = "chat-gpt-styles.html";
  const htmlStylesText = await loadResourceText(STYLES_HTML);
  const htmlStyles = htmlTextToHtmlElement(htmlStylesText);

  const elementsToAppend = htmlStyles.querySelectorAll("link, style");
  elementsToAppend.forEach((element) => {
    if (element instanceof HTMLElement) {
      appendElementToHead(document.body, element);
    }
  });

  // エディターを読み込み
  const EDITOR_ELEMENT_HTML = "editor-element.html";
  const loader = new ElementLoader(EditorElementsMap);
  await loader.loadFromURL(EDITOR_ELEMENT_HTML);

  const CODE_EDITOR_TABS_HTML = "code-editor-tabs.html";
  loader.elements.editor.src = chrome.runtime.getURL(CODE_EDITOR_TABS_HTML);

  container.registerInstance("EditorElementsMap", loader.elements);
  container.registerSingleton("EditorElement", EditorElement);
  const editor = container.resolve<EditorElement>("EditorElement");

  editor.initialize(CODE_EDITOR_TABS_HTML);

  document.body.appendChild(loader.elements.wrap);
}

/** HTMLプレビューの依存関係を解決します */
async function resolveHTMLPreviewDependency() {
  container.registerSingleton("HTMLPreview", HTMLPreview);
  container.resolve<HTMLPreview>("HTMLPreview");
}

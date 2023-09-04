/**
 * @file コンテンツスクリプト
 * Chrome拡張はコンテンツ、バッググラウンド、フレーム(iframe)等のコンテキストで実行されます。
 * DOMへのアクセスはウェブページに挿入されるコンテンツスクリプトが担います。
 */
import {
    CrossDispatcher,
    appendElementToHead,
    htmlTextToHtmlElement,
    loadResourceText,
    reserveLoadedAction,
} from "@nyanator/chrome-ext-utils";

import "./preview/html-preview";

import { initializeEditorElement } from "./editor/editor-element";
import { ContentEventListener } from "./interfaces/content-event-listener";
import { ContentScriptChannel } from "./interfaces/content-peer-content";
import { ContentToBackgroundMessageSender } from "./interfaces/content-to-background-message-sender";
import { ContentToEditorElementDispathcerSender } from "./interfaces/content-to-editor-element-dispatcher-sender";
import { ContentToEditorMessageSender } from "./interfaces/content-to-editor-message-sender";
import { EditorElementToContentDispathcerReceiver } from "./interfaces/editor-element-to-content-dispatcher-receiver";
import { EditorToContentMessageReceiver } from "./interfaces/editor-to-content-message-receiver";
import * as ChatGPTUtils from "./utils/chat-gpt-utils";

export class ContentScript {
    /**
     * コンテンツスクリプトを初期化します。
     */
    async initialize(): Promise<void> {
        // スタイルとリンクの適用
        this.appendLinkAndStyles();

        // エディターとの通信エージェント
        const contentPeerEditorFrameMessageAgent =
            await ChatGPTUtils.createWindowMessageAgent();

        // バックグランドとの通信エージェント
        const contentPeerBackgroundMessageAgent =
            await ChatGPTUtils.createRuntimeMessageAgent();

        // エディターエレメントへのディスパッチャー
        const contentPeerEditorCrossDispather =
            CrossDispatcher<ContentScriptChannel>({
                strictMode: true,
            });

        // コンテンツ->エディターエレメントのディスパッチャー送信実装
        const contentToEditorElementDispathcerSender =
            new ContentToEditorElementDispathcerSender(
                contentPeerEditorCrossDispather,
            );

        // コンテンツ->バックグラウンドへの送信実装
        const contentToBackgroundMessageSender =
            new ContentToBackgroundMessageSender(
                contentPeerBackgroundMessageAgent,
            );

        // エディター->コンテンツのメッセージ受信実装
        const editorMessageReceiver = new EditorToContentMessageReceiver(
            contentPeerEditorFrameMessageAgent,
            contentToBackgroundMessageSender,
            contentToEditorElementDispathcerSender,
        );
        editorMessageReceiver.startListening();

        // エディターエレメントの初期化
        const editorElements = await initializeEditorElement({
            parentElement: document.documentElement,
            crossDispathcer: contentPeerEditorCrossDispather,
        });

        // コンテンツ->エディターのメッセージ送信実装
        const contentToEditorMessageSender = new ContentToEditorMessageSender(
            contentPeerEditorFrameMessageAgent,
            editorElements.editor,
        );

        // エディターエレメント->コンテンツのディスパッチャー受信実装
        const editorElementToContentDispathcerReceiver =
            new EditorElementToContentDispathcerReceiver(
                contentPeerEditorCrossDispather,
                contentToEditorMessageSender,
                contentToBackgroundMessageSender,
            );
        editorElementToContentDispathcerReceiver.startChannel();

        // コンテンツスクリプトのイベントリスナー実装
        const contentEventListener = new ContentEventListener(
            contentToEditorMessageSender,
        );
        contentEventListener.startListening();
    }

    /**
     * Chat GPTのウェブサイトにhtmlファイルからスタイルやリンクを挿入
     */
    async appendLinkAndStyles(): Promise<void> {
        const htmlStylesText = await loadResourceText("chat-gpt-styles.html");
        const htmlStyles = htmlTextToHtmlElement(htmlStylesText);

        const elementsToAppend = htmlStyles.querySelectorAll("link, style");
        elementsToAppend.forEach((element) => {
            if (element instanceof HTMLElement) {
                appendElementToHead(document.documentElement, element);
            }
        });
    }
}

reserveLoadedAction(document, async () => {
    const contentScript = new ContentScript();
    contentScript.initialize();
});

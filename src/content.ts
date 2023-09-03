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
import { BackgroundMessageSender } from "./interfaces/background-message-sender";
import { ContentScriptChannel } from "./interfaces/content-peer-content";
import { ContentWindowMessageListener } from "./interfaces/content-window-message-listener";
import { EditorElementDispathcerReceiver } from "./interfaces/editor-element-dispatcher-receiver";
import { EditorElementDispathcerSender } from "./interfaces/editor-element-dispatcher-sender";
import { EditorMessageReceiver } from "./interfaces/editor-message-reciever";
import { EditorMessageSender } from "./interfaces/editor-message-sender";
import * as ChatGPTUtils from "./utils/chat-gpt-utils";

reserveLoadedAction(document, async () => {
    const contentScript = new ContentScript();
    contentScript.initialize();
});

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

        // エディターエレメントへのディスパッチャーの実装
        const editorElementDispathcerSender = new EditorElementDispathcerSender(
            contentPeerEditorCrossDispather,
        );

        // バックグラウンドへの送信実装
        const backgroundMessageSender = new BackgroundMessageSender(
            contentPeerBackgroundMessageAgent,
        );

        // エディターからのメッセージ受信実装
        const editorMessageReceiver = new EditorMessageReceiver(
            contentPeerEditorFrameMessageAgent,
            backgroundMessageSender,
            editorElementDispathcerSender,
        );
        editorMessageReceiver.startListening();

        // エディターエレメントの初期化
        const editorElements = await initializeEditorElement({
            parentElement: document.documentElement,
            crossDispathcer: contentPeerEditorCrossDispather,
        });

        // エディターへのメッセージ送信実装
        const editorMessageSender = new EditorMessageSender(
            contentPeerEditorFrameMessageAgent,
            editorElements.editor,
        );

        // エディターエレメントからのディスパッチャーの実装
        const editorElementDispathcerReceiver =
            new EditorElementDispathcerReceiver(
                contentPeerEditorCrossDispather,
                editorMessageSender,
                backgroundMessageSender,
            );
        editorElementDispathcerReceiver.startChannel();

        // コンテンツスクリプトのメッセージリスナーの実装
        const contentWindowMessageListener = new ContentWindowMessageListener(
            editorMessageSender,
        );
        contentWindowMessageListener.startListening();
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

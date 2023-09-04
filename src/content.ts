/**
 * @file コンテンツスクリプト
 * Chrome拡張はコンテンツ、バッググラウンド、フレーム(iframe)等のコンテキストで実行されます。
 * DOMへのアクセスはウェブページに挿入されるコンテンツスクリプトが担います。
 */
import {
    AESCryptoAgent,
    ConsoleLogger,
    CryptoAgent,
    EXT_ORIGIN,
    MessageData,
    MessageValidatorImpl,
    MessageValidatorManager,
    MessageValidatorManagerConfig,
    MessageValidatorManagerImpl,
    RuntimeMessageAgent,
    RuntimeMessageAgentImpl,
    SessionStaticKey,
    SessionStaticToken,
    WindowMessageAgent,
    WindowMessageAgentImpl,
    appendElementToHead,
    htmlTextToHtmlElement,
    loadResourceText,
} from "@nyanator/chrome-ext-utils";

import { container } from "tsyringe";
//import "./preview/html-preview";
import { ContentToEditorMessageSender } from "./interfaces/content-to-editor-message-sender";
import { ORIGIN } from "./utils/chat-gpt-utils";

export class ContentScript {
    /**
     * コンテンツスクリプトを初期化します。
     */
    async initialize(): Promise<void> {
        container.register("Logger", {
            useClass: ConsoleLogger,
        });

        container.register("SessionStaticToken", {
            useClass: SessionStaticToken,
        });

        container.register("SessionStaticKey", {
            useClass: SessionStaticKey,
        });

        container.register("MessageValidatorConfig", {
            useValue: {
                runtimeId: chrome.runtime.id,
                allowedOrigins: [ORIGIN, EXT_ORIGIN],
            },
        });

        container.register<CryptoAgent<MessageData>>("CryptoAgent", {
            useClass: AESCryptoAgent<MessageData>,
        });

        container.register<MessageValidatorImpl<MessageData>>(
            "MessageValidator",
            {
                useClass: MessageValidatorImpl<MessageData>,
            },
        );

        container.register<MessageValidatorManagerConfig>(
            "MessageValidatorManagerConfig",
            {
                useValue: {
                    maxMessageValidators: 3,
                    validatorRefreshInterval: 1,
                },
            },
        );

        container.register<RuntimeMessageAgent<MessageData>>(
            "RuntimeMessageAgent",
            {
                useClass: RuntimeMessageAgentImpl,
            },
        );

        container.registerSingleton<MessageValidatorManager<MessageData>>(
            "MessageValidatorManager",
            MessageValidatorManagerImpl<MessageData>,
        );

        container.register<WindowMessageAgent<MessageData>>(
            "WindowMessageAgent",
            {
                useClass: WindowMessageAgentImpl,
            },
        );

        const test = container.resolve(ContentToEditorMessageSender);
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

// reserveLoadedAction(document, async () => {
//     const contentScript = new ContentScript();
//     contentScript.initialize();
// });

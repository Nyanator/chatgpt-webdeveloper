import {
  CryptoAgent,
  DatabaseAgent,
  MessageAgent,
} from "@nyanator/chrome-ext-utils/";
import * as MessagingFactories from "@nyanator/chrome-ext-utils/dist/messaging/factories";
import * as StorageFactories from "@nyanator/chrome-ext-utils/dist/storage/factories";
import { chrome } from "jest-chrome";

import "fake-indexeddb/auto";

import { ChatGPTWebDeveloperBackgroundScript } from "../../script-class/chatgpt-webdeveloper-background-script";
import * as ChatGPTUtils from "../../utils/chat-gpt-utils";
import { KindMessageData, MSG_KIND } from "../../utils/message-def";
import * as MockUtils from "../mocks/mock-utils";

describe("ChatGPTWebDeveloperBackgroundScript クラス", () => {
  let databaseAgent: DatabaseAgent;
  let messageAgent: MessageAgent<KindMessageData>;
  let scriptInstance: ChatGPTWebDeveloperBackgroundScript;
  let cryptoAgent: CryptoAgent<KindMessageData>;

  beforeEach(async () => {
    MockUtils.mockAllSessionValues();

    databaseAgent = StorageFactories.createDatabaseAgent(
      "databasename",
      "storename",
    );
    await databaseAgent.open();

    cryptoAgent = await MessagingFactories.createCryptoAgent<KindMessageData>();
    jest
      .spyOn(MessagingFactories, "createCryptoAgent")
      .mockResolvedValue(cryptoAgent);

    messageAgent = await MessagingFactories.createMessageAgent<KindMessageData>(
      MockUtils.mockValidatorConfig,
    );

    scriptInstance = new ChatGPTWebDeveloperBackgroundScript(
      databaseAgent,
      messageAgent,
    );
  });

  it("初期化時にイベントリスナーを設定する", async () => {
    const spy = jest.spyOn(messageAgent, "runtimeMessageListener");
    await scriptInstance.initialize();
    expect(spy).toHaveBeenCalled();
  });

  it("メッセージデータを適切にデータベースに保存する", async () => {
    const saveSpy = jest.spyOn(databaseAgent, "save");
    await testMessageHandling({
      kind: MSG_KIND.Save,
      subKind: "subKind",
      message: MockUtils.message,
      spyFunc: saveSpy,
      shouldNotBeCalled: false,
      expectedArgs: ["subKind", MockUtils.message],
    });
  });

  it("subKindがfalsyの時データベースに保存されない", async () => {
    const saveSpy = jest.spyOn(databaseAgent, "save");
    await testMessageHandling({
      kind: MSG_KIND.Save,
      subKind: undefined,
      message: MockUtils.message,
      spyFunc: saveSpy,
      shouldNotBeCalled: true,
    });
  });

  it("HTMLWindowを表示する", async () => {
    const windowsCreateSpy = jest.spyOn(chrome.windows, "create");
    await testMessageHandling({
      kind: MSG_KIND.ShowHTMLWindow,
      subKind: undefined,
      message: "<h1>Hello World</h1>",
      spyFunc: windowsCreateSpy,
    });
  });

  it("データベースからデータをロードする", async () => {
    const subKind = "someSubKind";
    const mockStoredData = "mockStoredData";
    await databaseAgent.save(subKind, mockStoredData);

    await scriptInstance.initialize();
    const mockMessageData = MockUtils.createMockKindMessageData(
      MSG_KIND.Load,
      subKind,
      "",
      cryptoAgent,
    );
    const loadedData: KindMessageData = (await simulateMessage(
      mockMessageData,
    )) as KindMessageData;

    expect(loadedData.message).toEqual(mockStoredData);
    expect(loadedData.subKind).toEqual(subKind);
  });

  it("URLが変更されたときに別のコンテキストに通知する", async () => {
    const messageAgentSendSpy = jest.spyOn(messageAgent, "sendRuntimeMessage");
    await scriptInstance.initialize();

    chrome.tabs.onUpdated.callListeners(123, { url: ChatGPTUtils.ORIGIN }, {
      id: 123,
      active: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(messageAgentSendSpy).toHaveBeenCalled();
  });

  it("アクティブで無いときはURL変更通知は飛ばない", async () => {
    const messageAgentSendSpy = jest.spyOn(messageAgent, "sendRuntimeMessage");
    await scriptInstance.initialize();

    chrome.tabs.onUpdated.callListeners(123, { url: ChatGPTUtils.ORIGIN }, {
      id: 123,
      active: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(messageAgentSendSpy).not.toHaveBeenCalled();
  });

  it("オリジンが違うときはURL変更通知は飛ばない", async () => {
    const messageAgentSendSpy = jest.spyOn(messageAgent, "sendRuntimeMessage");
    await scriptInstance.initialize();

    chrome.tabs.onUpdated.callListeners(123, { url: "https://invalid.com" }, {
      id: 123,
      active: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(messageAgentSendSpy).not.toHaveBeenCalled();
  });

  interface TestMessageHandlingOptions {
    kind: MSG_KIND;
    subKind?: string;
    message: string;
    spyFunc: jest.SpyInstance;
    shouldNotBeCalled?: boolean;
    expectedArgs?: unknown[];
  }

  /** メッセージ通信と関数の呼び出しをテスト */
  async function testMessageHandling(options: TestMessageHandlingOptions) {
    await scriptInstance.initialize();
    const mockMessageData = MockUtils.createMockKindMessageData(
      options.kind,
      options.subKind,
      options.message,
      cryptoAgent,
    );
    await simulateMessage(mockMessageData);

    if (options.shouldNotBeCalled) {
      expect(options.spyFunc).not.toHaveBeenCalled();
    } else {
      options.expectedArgs && options.expectedArgs.length > 0
        ? expect(options.spyFunc).toHaveBeenCalledWith(...options.expectedArgs)
        : expect(options.spyFunc).toHaveBeenCalled();
    }
  }

  async function simulateMessage(
    mockMessageData: unknown,
    origin = MockUtils.mockValidatorConfig.allowedOrigins[0],
  ) {
    return new Promise((resolve) => {
      chrome.runtime.onMessage.callListeners(
        mockMessageData,
        { origin },
        resolve,
      );
    });
  }
});

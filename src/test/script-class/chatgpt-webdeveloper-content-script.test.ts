// import { MessageAgent } from "@nyanator/chrome-ext-utils/";
// import * as MessagingFactories from "@nyanator/chrome-ext-utils/dist/messaging/factories";

// import { ChatGPTWebDeveloperContentScript } from "../../script-class/chatgpt-webdeveloper-content-script";
// import { KindMessageData } from "../../utils/message-def";
// import * as MockUtils from "../mocks/mock-utils";

// describe("ChatGPTWebDeveloperContentScript クラス", () => {
//   let messageAgent: MessageAgent<KindMessageData>;
//   let scriptInstance: ChatGPTWebDeveloperContentScript;

//   beforeEach(async () => {
//     MockUtils.initMockFetch();
//     MockUtils.mockAllSessionValues();

//     messageAgent =
//       await MessagingFactories.createMessageAgent<KindMessageData>(
//         MockUtils.mockValidatorConfig,
//       );

//     scriptInstance = new ChatGPTWebDeveloperContentScript(messageAgent);
//   });

//   it("正常に初期化できる", async () => {
//     await scriptInstance.initialize();
//   });
// });

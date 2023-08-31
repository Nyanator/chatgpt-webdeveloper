import {
  findCodeBlockDivFromCodeElement,
  findInputForm,
  findNewChatButton,
  reserveLoadedAction,
} from "../../utils/chat-gpt-utils";

describe("Chat GPT 関連ユーティリティ", () => {
  it("reserveLoadedAction 指定されたアクションを動的に生成されるDOMが完了したときに実行する", async () => {
    document.body.innerHTML = `
      <body>
        <div></div>
      </body>
    `;

    // 動的にDOMを生成するシミュレーション
    setTimeout(() => {
      const parentDiv = document.querySelector("div");
      const groupDiv = document.createElement("div");
      groupDiv.className = "group w-full";
      parentDiv?.appendChild(groupDiv);
    }, 100); // 100ミリ秒後にDOMを追加

    const mockAction = jest.fn();
    await reserveLoadedAction(mockAction);
    expect(mockAction).toHaveBeenCalled();
  });

  it("findInputForm Chat GPTのInput Formを探す", () => {
    document.body.innerHTML = `
      <body>
        <div>
          <div class="absolute bottom-0 left-0 w-full"></div>
        </div>
      </body>
    `;

    const result = findInputForm();
    expect(result).toBeTruthy();
    expect(result?.classList.contains("absolute")).toBeTruthy();
  });

  it("findNewChatButton Chat GPTのNew Chatボタンを探す", () => {
    document.body.innerHTML = `
      <body>
        <a>Not a new chat</a>
        <a>New chat</a>
      </body>
    `;

    const result = findNewChatButton();
    expect(result).toBeTruthy();
    expect(result?.innerHTML).toContain("New chat");
  });

  it("findCodeBlockDivFromCodeElement codeタグから親方向に遡りコードブロックを探す", () => {
    document.body.innerHTML = `
      <body>
        <div class="rounded-md mb-4">
          <code></code>
        </div>
      </body>
    `;

    const codeElem = document.querySelector("code") as HTMLElement;
    const result = findCodeBlockDivFromCodeElement(codeElem);
    expect(result).toBeTruthy();
    expect(result?.classList.contains("rounded-md")).toBeTruthy();
  });
});

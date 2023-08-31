import interact from "interactjs";

import {
  draggableSetting,
  resizableSetting,
} from "../../utils/interactjs-utils";

describe("InteractJS関連のユーティリティ", () => {
  let container: HTMLDivElement;
  let gripTarget: HTMLDivElement;
  let dragElement: HTMLDivElement;
  let resizableElement: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    gripTarget = document.createElement("div");
    dragElement = document.createElement("div");
    resizableElement = document.createElement("div");

    gripTarget.textContent = "Gripする要素";
    dragElement.textContent = "ドラッグする要素";
    resizableElement.textContent = "リサイズする要素";

    container.append(gripTarget, dragElement, resizableElement);
    document.body.append(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("要素をドラッグで移動する", () => {
    draggableSetting(
      gripTarget,
      dragElement,
      () => {
        /* ドラッグ中のコールバック */
      },
      () => {
        /* ドラッグ終了のコールバック */
      },
    );

    // Interact.jsのイベントをトリガーして、ドラッグをシミュレート
    interact(gripTarget)
      .fire({
        type: "dragstart",
        target: gripTarget,
        clientX: 0,
        clientY: 0,
      })
      .fire({
        type: "dragmove",
        target: gripTarget,
        clientX: 0 + 50,
        clientY: 0 + 50,
        dx: 50,
        dy: 50,
      })
      .fire({
        type: "dragend",
        target: gripTarget,
      });

    expect(dragElement.style.left).toBe("50px");
    expect(dragElement.style.top).toBe("50px");
  });

  it("要素をリサイズする", () => {
    resizableSetting(
      resizableElement,
      () => {
        /* リサイズ中のコールバック */
      },
      () => {
        /* リサイズ終了のコールバック */
      },
    );

    const initialWidth = 100; // 初期の幅
    const initialHeight = 100; // 初期の高さ

    const resizeByWidth = 50; // 幅を50ピクセル増やす
    const resizeByHeight = 100; // 高さを100ピクセル増やす

    // Interact.jsのイベントをトリガーして、リサイズをシミュレート
    interact(resizableElement)
      .fire({
        type: "resizestart",
        target: resizableElement,
        rect: {
          left: 0,
          top: 0,
          right: initialWidth,
          bottom: initialHeight,
          width: initialWidth,
          height: initialHeight,
        },
        edges: { top: false, left: false, bottom: true, right: true },
      })
      .fire({
        type: "resizemove",
        target: resizableElement,
        rect: {
          left: 0,
          top: 0,
          right: initialWidth + resizeByWidth,
          bottom: initialHeight + resizeByHeight,
          width: initialWidth + resizeByWidth,
          height: initialHeight + resizeByHeight,
        },
        deltaRect: {
          left: 0,
          top: 0,
          right: resizeByWidth,
          bottom: resizeByHeight,
        },
        edges: { top: false, left: false, bottom: true, right: true },
      })
      .fire({
        type: "resizeend",
        target: resizableElement,
      });

    expect(resizableElement.style.width).toBe("150px");
    expect(resizableElement.style.height).toBe("200px");
  });
});

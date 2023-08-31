import interact from "interactjs";

/**
 * 要素にドラッグ処理の設定をします。
 * @param gripTarget ドラッグを有効化する対象要素
 * @param dragElement ドラッグされる要素
 * @param moveAction ドラッグ中のコールバック関数
 * @param endAction ドラッグ終了時のコールバック関数
 */
export const draggableSetting = (
  gripTarget: HTMLElement,
  dragElement: HTMLElement,
  moveAction: (event: interact.DragEvent) => void | undefined,
  endAction: (event: interact.DragEvent) => void | undefined,
) => {
  interact(gripTarget).draggable({
    inertia: false,
    listeners: {
      move: (event: interact.DragEvent) => {
        moveAction?.(event);

        const target = dragElement;
        const rect = target.getBoundingClientRect();
        const x = rect.x + event.dx;
        const y = rect.y + event.dy;
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
      },
      end: (event: interact.DragEvent) => {
        endAction?.(event);
      },
    },
    modifiers: [
      interact.modifiers.restrict({
        restriction: "parent",
        endOnly: true,
      }),
    ],
    autoScroll: true,
  });
};

/**
 * 要素のリサイズ処理の設定をします。
 * @param target リサイズを有効化する対象要素
 * @param moveAction リサイズ中のコールバック関数
 * @param endAction リサイズ終了時のコールバック関数
 */
export const resizableSetting = (
  target: HTMLElement,
  moveAction: (event: interact.ResizeEvent) => void | undefined,
  endAction: (event: interact.ResizeEvent) => void | undefined,
) => {
  interact(target).resizable({
    edges: { top: true, left: true, bottom: true, right: true },
    listeners: {
      move: (event: interact.ResizeEvent) => {
        moveAction?.(event);

        const target = event.target;
        const rect = target.getBoundingClientRect();
        target.style.width = `${event.rect.width}px`;
        target.style.height = `${event.rect.height}px`;
        rect.x += event.deltaRect.left;
        rect.y += event.deltaRect.top;
        target.style.left = `${rect.x}px`;
        target.style.top = `${rect.y}px`;
      },
      end: (event: interact.event) => {
        endAction?.(event);
      },
    },
  });
};

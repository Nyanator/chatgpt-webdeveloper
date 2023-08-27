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
  moveAction: (event: unknown) => void | undefined,
  endAction: (event: unknown) => void | undefined,
) => {
  interact(gripTarget).draggable({
    inertia: false,
    listeners: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      move: (event: any) => {
        moveAction?.(event);

        const target = dragElement;
        const rect = target.getBoundingClientRect();
        const x = rect.x + event.dx;
        const y = rect.y + event.dy;
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      end: (event: any) => {
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
  moveAction: (event: unknown) => void | undefined,
  endAction: (event: unknown) => void | undefined,
) => {
  interact(target).resizable({
    edges: { top: true, left: true, bottom: true, right: true },
    listeners: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      move: (event: any) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      end: (event: any) => {
        endAction?.(event);
      },
    },
  });
};

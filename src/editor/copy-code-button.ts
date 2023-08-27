import { assertNotNull } from "@nyanator/chrome-ext-utils";

/**
 * Copy codeボタンを操作するためのクラスです。
 */
export class CopyCodeButtonElement {
  readonly copycodeButton: HTMLButtonElement;
  readonly copyPath: HTMLElement;
  readonly copyRect: HTMLElement;
  readonly copyPolyline: HTMLElement;
  readonly copyTextBefore: HTMLSpanElement;
  readonly copyTextAfter: HTMLSpanElement;
  private readonly clickAction: { (): void };

  /**
   * CopyCodeButtonElement のインスタンスを生成します。
   * @param htmlElement Copy codeボタンおよび関連要素を含む親要素
   * @param clickAction ボタンがクリックされた際に実行されるアクション
   */
  constructor(htmlElement: HTMLElement, clickAction: { (): void }) {
    // 各要素を取得および設定
    this.copycodeButton = assertNotNull(
      htmlElement.querySelector<HTMLButtonElement>(".editor-copycode"),
    );
    this.copyPath = assertNotNull(
      htmlElement.querySelector<HTMLElement>(".copy-path"),
    );
    this.copyRect = assertNotNull(
      htmlElement.querySelector<HTMLElement>(".copy-rect"),
    );
    this.copyPolyline = assertNotNull(
      htmlElement.querySelector<HTMLElement>(".copy-polyline"),
    );
    this.copyTextBefore = assertNotNull(
      htmlElement.querySelector<HTMLSpanElement>(".copytext-before"),
    );
    this.copyTextAfter = assertNotNull(
      htmlElement.querySelector<HTMLSpanElement>(".copytext-after"),
    );
    this.clickAction = clickAction;

    // ボタンのクリックイベント設定を行う
    this.clickButtonSetting();
  }

  /**
   * コピーコードボタンのクリックイベントの設定をします。
   * コピーアクションの実行とアニメーションの切り替えます。
   */
  clickButtonSetting() {
    this.copycodeButton.addEventListener("click", () => {
      this.clickAction();

      // アニメーションの表示切り替えを行う
      this.copyPath.style.display = "none";
      this.copyRect.style.display = "none";
      this.copyPolyline.style.display = "inline";
      this.copyTextBefore.style.display = "none";
      this.copyTextAfter.style.display = "inline";

      // 一定時間後にアニメーションを元に戻す
      setTimeout(() => {
        this.copyPath.style.display = "inline";
        this.copyRect.style.display = "inline";
        this.copyPolyline.style.display = "none";
        this.copyTextBefore.style.display = "inline";
        this.copyTextAfter.style.display = "none";
      }, 2000);
    });
  }
}

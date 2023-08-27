/** バックグランドスクリプト */
export interface BackgroundScript {
  /**
   * 初期化
   */
  initialize(): Promise<void>;
}

import { ContentScript } from "../content";

describe("コンテンツスクリプト", () => {
    it("コンテンツスクリプト", async () => {
        const contentScript = new ContentScript();
        await contentScript.initialize();
    });
});

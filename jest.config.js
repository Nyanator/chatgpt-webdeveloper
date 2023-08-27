/**
 * @file テストフレームワークjestの設定ファイル。
 */

// swc/jestでjest.spyOnすると例外が発生するため例外を回避するプラグインを導入した
// https://www.npmjs.com/package/jest_workaround
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("node:fs");
const swcrc = JSON.parse(fs.readFileSync(".swcrc", "utf8"));

// If you have other plugins, change this line.
((swcrc.jsc ??= {}).experimental ??= {}).plugins = [["jest_workaround", {}]];

// eslint-disable-next-line no-undef
module.exports = {
  testEnvironment: "jsdom",
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.(ts)$": ["@swc/jest", swcrc],
  },
  testEnvironmentOptions: {
    url: "http://localhost/",
  },
  setupFilesAfterEnv: ["./jest.setup.js"],
};

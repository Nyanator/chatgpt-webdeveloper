/**
 * @file テストフレームワークjestの設定ファイル。
 */

// Chrome拡張のAPIをjestで使用するためのモックです
/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-var-requires
Object.assign(global, require("jest-chrome"));
global.TextDecoder = require("util").TextDecoder;
global.TextEncoder = require("util").TextEncoder;

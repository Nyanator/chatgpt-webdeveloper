/**
 * @file ビルドツールViteの設定ファイル。
 */
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { viteStaticCopy } from "vite-plugin-static-copy";

interface EntryPoints {
  [key: string]: string;
}

// 複数エントリポイントを持つビルドをするために、npmのタスクランナーから複数回起動します
const entryPoints: EntryPoints = {
  ep1: "src/background.ts",
  ep2: "src/contents.ts",
  ep3: "src/editor/code-editor-tabs.ts",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default defineConfig(({ mode }) => {
  const entry = process.env.ep || "ep1";

  return {
    plugins: [
      monacoEditorPlugin({}),
      viteStaticCopy({
        targets: [
          {
            src: "src/manifest.json",
            dest: "./",
          },
          {
            src: "src/cryptokey",
            dest: "./",
          },
          {
            src: "src/**/*.js",
            dest: "./",
          },
          {
            src: "src/**/*.html",
            dest: "./",
          },
          {
            src: "src/**/*.css",
            dest: "./",
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      assetsDir: "assets",
      emptyOutDir: false,
      sourcemap: false,
      rollupOptions: {
        input: entryPoints[entry],
        output: {
          entryFileNames: "[name].js",
          format: "iife",
          preserveModules: false,
        },
      },
    },
    // // console出力を無効にします
    // esbuild: {
    //   drop: ["console", "debugger"],
    // },
  };
});

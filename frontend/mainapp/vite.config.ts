// vite.config.ts
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";

import tailwindcss from "@tailwindcss/vite";

// CJS モジュールなので import * as でも OK
import StyleDictionaryPackage from "style-dictionary";
const StyleDictionary = StyleDictionaryPackage as unknown as {
  new (config: any): { buildAllPlatforms(): void };
};

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    tailwindcss(),
    // StyleDictionary プラグイン
    ((): Plugin => ({
      name: "style-dictionary",
      buildStart() {
        // ① インスタンスを作成
        const sd = new StyleDictionary({
          source: ["tokens.json"],
          platforms: {
            scss: {
              transformGroup: "scss",
              buildPath: "src/styles/abstracts/",
              files: [
                { destination: "_variables.scss", format: "scss/variables" },
              ],
            },
            css: {
              transformGroup: "css",
              buildPath: "public/styles/",
              files: [
                { destination: "variables.css", format: "css/variables" },
              ],
            },
          },
        });
        // ② 全プラットフォームをビルド
        sd.buildAllPlatforms();
      },
    }))(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@root": path.resolve(__dirname, "./"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});

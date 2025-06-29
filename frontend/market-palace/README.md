# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

# AudioGen SaaS Frontend

## デザインシステム・運用ルール

このプロジェクトは、shadcn/ui@4 + Tailwind CSS + カスタムCSS変数によるデザイン一元管理を徹底しています。

### デザイン統一のためのガイドライン

- **全ページは必ず `Layout` コンポーネントでラップしてください。**
- **セクション見出しは `SectionTitle` を使ってください。**
- **特徴紹介は `FeatureCard`、ステップ表示は `StepCard` を使ってください。**
- **色・フォント・角丸・影・余白などは `tailwind.config.js` と `public/styles/variables.css` の変数を使ってください。**
- **新しいUIパターンが必要な場合は、`src/components/common` 配下に共通部品として追加してください。**
- **既存部品のデザイン変更は、全体に影響することを意識して慎重に行ってください。**

### カスタムテーマ・デザイン変数

- `public/styles/variables.css` でCSSカスタムプロパティ（色・余白・角丸など）を一元管理しています。
- `tailwind.config.js` でTailwindのカスタムテーマ（colors, fontFamily, borderRadius, boxShadow, spacingなど）を設定しています。
- デザイン変更はこれらのファイルを編集することで全体に反映されます。

### Storybookやデザインドキュメント（任意）

- UI部品の一覧・テスト・ドキュメント化のために Storybook の導入も推奨します。
- デザインシステムや運用ルールはREADMEやdocsにまとめておくと、チーム開発や保守がスムーズです。

---

## 開発・運用の流れ（例）

1. 新規ページや機能を追加する際は、まず `Layout` でラップし、共通UI部品を活用してください。
2. デザイン変更や新しいUIパターンが必要な場合は、共通部品として追加・拡張してください。
3. カラーやフォントなどのテーマ変更は `variables.css` と `tailwind.config.js` を編集してください。
4. 必要に応じてStorybookやデザインドキュメントも活用してください。

---

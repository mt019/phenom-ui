# phenom-ui

站群的共用層。根目錄是 React 版 `@phenomcanvas/ui`（`src/`、`tailwind-preset.js`、`fonts/`、
`scripts/`），`packages/vue` 是 Vue 版 `@phenomcanvas/ui-vue`，`packages/vue-demo` 是 ui-vue
的驗收頁。遷移計畫正本在 phenom-ops `docs/vue-fleet-plan-20261030.md`。

## React 版凍結（2026-10-30 起，計畫 0-2）

- `@phenomcanvas/ui` 只修錯：不加元件、不加 props、不加功能。消費站回報的錯照常修、照常發
  patch 版（`v0.1.x`）。
- 新元件與新功能一律只進 `packages/vue`。排隊中的 React 站要用到新功能時，邏輯寫成框架無關
  的 `.js`，React 端只留介面（計畫 0-3）。
- 第 6 階段全站移除 React 後，React 套件封存，最後一個 tag 記入計畫正本。

## 框架無關的設計來源

`src/styles/*.css`、`src/styles/palettes.js`、`src/styles/oklch.js`、`tailwind-preset.js`、
`fonts/`、`assets/` 兩版共用，只改這裡的正本。`packages/vue/core/` 是
`packages/vue/scripts/stage-core.mjs` 打包時複製出來的產物（已列 .gitignore），不手改。

## ui-vue 維護

- Node 22.23.4。
- 格式化：`packages/vue` 下跑 `prettier --write src scripts`，設定在
  `packages/vue/.prettierrc.json`。`htmlWhitespaceSensitivity` 必須是 `strict`；預設的 css 模式
  會把 button 內的文字移到新行，編譯後文字節點多出空白。
- 只改格式的提交，要證明建置產物前後逐位元組相同，比對用的設定與用法在
  `packages/vue/scripts/compare-build.vite.config.mjs`。
- 每補一批元件發一版，tag `ui-vue-v0.x.y`；消費站以 `vendor/` 下的 tarball 固定版本。換同名
  tarball 時先刪 `node_modules/@phenomcanvas/ui-vue` 再 `npm install ./vendor/<tgz>`，並核
  lockfile 的 integrity。

## 驗證

```sh
npm run validate          # React 版
cd packages/vue-demo && npm run build && npm run test:ssr
```

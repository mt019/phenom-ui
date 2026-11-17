# 外觀選單色票按鈕對照（2026-11-17）

站主 11-17 反映：外觀選單的色票按鈕比實際色票難看。

| 檔 | 內容 |
|---|---|
| `swatch.html` | 18 套色票三種按鈕畫法並排，色值由 `src/styles/palettes.js` 匯出 |
| `swatch.png` | 上檔以 Chrome headless 2 倍解析度截圖 |

現況（`src/components/AppearanceMenu.jsx:82`、`packages/vue/src/components/reading/AppearanceMenu.vue:115`）：24 px 圓整片填 accent，外加 1 px 框。站上 accent 只出現在細線與字上，整片填滿時中明度、偏飽和的幾套（mango、klimt、mikan、white-peach、wheatfield）顯得土而吵；按鈕不帶該套的 surface，看不出色票在頁面上的樣子。

候選：

1. 甲：surface 淡底圓角方塊，上置 accent 色「文」字。
2. 乙：surface 淡底圓，中央 9 px accent 圓點。

兩案均去外框，選中者以墨色環標示。待站主選定；選定後 React 與 Vue 兩版同改，React 版凍結，只改樣式。

## 紙紋選項在部分站無作用（同日站主反映）

`setSiteTexture` 把所選紙紋寫進根層 `--paper-texture`，讀這個變數的只有 `body::before`（`src/styles-base.css:309`）與 `.paper-texture::before`（同檔 `:346`）。頁面的 `<main>` 若帶不透明 `bg-paper` 而只掛 `reading-grain`，`body::before` 被 main 的底色蓋住，`.reading-grain::before` 又只畫固定噪點、不讀變數，選什麼紙紋都不顯示。

各倉 `src` 只掛 `reading-grain`、未掛 `paper-texture` 的：phenom-renwen（9 檔，全部頁面）、phenom-notes（6）、phenom-french（2）、phenom-brief-react-202608（2）。statistics 10 對 1、tokugawa、guzhun 等兩者混用，要逐頁看。

改法候選：

1. 共用層：`.reading-grain::before` 的 `background-image` 改為 `var(--paper-texture, none), <原噪點>`，`background-size` 同樣前置 `var(--paper-texture-size, auto)`。各站升版即生效，不改各站頁面。
2. 各站：頁面 `reading-grain` 換成或加上 `paper-texture`。

另：各款紙紋的不透明度在 0.016 至 0.045 之間，修好之後在部分螢幕上仍可能淡到看不出，修完要實機看一次。

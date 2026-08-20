# @phenomcanvas/ui

Phenom 網站群的版本化共用層。這個 package 收：

- design tokens、色票、紙紋與 Tailwind preset；
- 共用網站殼、導覽、閱讀控制與 UI primitives；
- SEO metadata helper；
- 完整共用 web fonts 與來源／授權紀錄；
- 無業務語意的 design validators。

研究資料、站點 schema、站點文案與產品專用元件不進本倉。

Consumer 必須鎖定 release tag，不追浮動 `main`：

```json
{
  "dependencies": {
    "@phenomcanvas/ui": "github:mt019/phenom-ui#v0.1.0"
  }
}
```

Tailwind consumer 同時套用 preset，並掃描 package 原始碼：

```js
import phenomPreset from '@phenomcanvas/ui/tailwind-preset';

export default {
  presets: [phenomPreset],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@phenomcanvas/ui/src/**/*.{js,jsx}',
  ],
};
```

入口 CSS：

```js
import '@phenomcanvas/ui/styles.css';
```

### 字型的兩種投遞

字型檔隨 package 發布，兩個入口的差別只在 `@font-face` 的 `url()` 怎麼寫。

`styles.css` 是預設，`url()` 是套件相對路徑，由 consumer bundler 轉成自己的不可變資產。
獨佔一個子域名的站用它。各站一個 origin，本來就共享不了快取。

`styles-external-fonts.css` 給同一個 origin 上有多個站的情形（`studies.phenomcanvas.com`
底下四個產品站）。`url()` 寫絕對路徑 `/assets/fonts/<檔名>.<內容雜湊>.woff2`，vite 不處理
絕對路徑，所以字型不進各站的產物，四個站共用同一組網址、同一份瀏覽器快取。改引它的站要掛
配套的 vite plugin，開發伺服器與 preview 才有人供應那些檔案：

```js
import externalFonts from '@phenomcanvas/ui/scripts/vite-external-fonts.mjs';

plugins: [react(), externalFonts()]               // 引用端
plugins: [react(), externalFonts({ emit: true })] // 供應端：另把字型寫進自己的產物
```

供應端只能有一個（該 origin 的底座），並在 `public/_headers` 給 `/assets/fonts/*` 一年期
`immutable`。`src/fonts-external.css` 與 `fonts/external-manifest.json` 由
`scripts/build-external-fonts.mjs` 從 `src/fonts-local.css` 產生，改完字型跑一次；
`npm run validate` 會比對兩者是否同步。

## 不可退讓的排版與導航契約

- 顯示／裝飾字體必須原生覆蓋頁面可見語言的字形。德文至少包含
  `ÄÖÜäöüß`；不接受瀏覽器只用 fallback 補變音符號。`npm test` 會直接檢查
  Erikas regular 與 bold 的 WOFF2 字形表，subset 漏字即失敗。
- 文章與其他內頁的 eyebrow 是返回上層索引的導航，必須傳入
  `eyebrowBack={{ href, label }}`。只有索引頁／首頁可使用沒有目的地的純標籤。
- 共用 `Eyebrow` 統一處理真實連結、詞距、油墨字重與 `font-synthesis`；各站不要另寫一套
  看似相同但不能返回的眉題。

## 版型殼

三個，按頁面的意圖選，不按外觀相似度選：

- `ArticleLayout`——一篇長文。左欄章節導覽、中間 44rem 閱讀欄、右欄目次。
- `DashboardLayout`——抬頭在上、分頁列吸在頂端、內容滿寬。分頁切的是「哪一期／哪個視圖」。
- `RailLayout`（v0.1.31）——導覽與識別整條收在左欄，右邊整片留給工作區。讀者在一批資料裡
  切檢視、搜尋、篩選時用，導覽不隨頁面捲走。窄屏時左欄的內容排進正常流，導覽那一列吸頂。

自己刻版型的頁登記在 `phenom-ops/infra/shared-shell.json`，由 `check:shared-shell` 看守。

## 資料表

`DataTable`（v0.1.46）收篇章清單、案件清單這種一列一筆的表。欄寬寫在 `columns` 的 `width`
裡，由 colgroup 宣告，版面是 `table-layout: fixed`。

**欄寬不准交給內容決定。** auto 版面拿一欄裡最長的那一列當整欄的寬度，而長度的分布通常
偏斜：iias 篇章表 795 列的作者中位數 3 個字，其中一列是三位西文作者共 50 字，作者欄那一
列就把整欄撐開，多出來的寬度從篇名與出處扣，出處每列折成三行。同理 `white-space: nowrap`
只給數值欄與按鈕欄，內容欄要能折行。

`sticky` 與 `minWidth` 只能擇一：`minWidth` 把表包進橫向捲動容器，表頭的 `position: sticky`
會改成貼那個容器的頂端。長清單要留表頭選 `sticky`，窄欄位多的表選 `minWidth`。

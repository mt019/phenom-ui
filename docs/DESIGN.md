# 色彩紀律正典（站群唯一正本）

本檔與 `src/styles/tokens.css`、`src/styles/palettes.js` 同倉同版本，是 phenomcanvas
站群色彩規則的唯一正本。各站 `docs/DESIGN.md` 的色票節一律指到這裡，不各自維護副本；
歷史上 canvas 的 `docs/DESIGN.md` 色票庫節（296–348 行）是本檔的前身，內容以本檔為準。
判定在 `scripts/lib/color-system.mjs`，站群五個倉共用一份（各倉的
`scripts/validate-color-system.mjs` 只宣告自己的路徑與參數）；帶寬與可辨門檻的數值
取自 `src/styles/oklch.js`，色票庫與色彩原理頁讀的是同一份。負向測試在
`tests/color-rules.test.mjs`，改判定就跑 `npm test`。

## 鐵律

- **色票管裝飾與框架，正文閱讀面永遠近白。** 每套色票的 `paper` 只准帶極輕微色傾向；
  有色的 `surface` 只用在邊框、側欄、卡片、badge 等鉻件。
- **顏色一律抄已審值，禁止生成。** 已審值只有三個來源：`palettes.js` 的條目（含
  `PALETTES`、`MARK_TONES`）、`tokens.css` 的 Layer-0 色調對、站內已被站主看過不反感
  的既有元件真值。用任何公式、驗證器、外部名牌色票（GitHub Primer、Notion、Radix）
  產生或搬運新 hex，2026-08-16 站主明令全局底層禁止。dataviz 類驗證器只准當事後
  檢查；其門檻與本檔帶寬衝突時，**本檔為準**。
- **新色的升格程序**：候選先進 PaletteLab（canvas `/palettelab`，資料層 `palettes.js`），
  站主點名、或同一套被兩頁以上使用，才升進 `tokens.css`。中途要給站主比選時，
  在 scratchpad 做 HTML 並排 mock 開瀏覽器看，不部署試錯。

## 帶寬（validator 強制，飄出即 build 失敗）

- 色調對 `-tx`（文字／小 mark）：OKLCH L 0.46–0.58、C 0.045–0.13（莫蘭迪，不純不灰），
  全體明度極差 ≤ 0.10。`-bg`（淡底）：L 0.90–0.97、C ≤ 0.035。
- H 50–140（土黃到土綠）是危險帶：中等彩度就讀成土色，非有已審值不進。
- 兩支 `-tx` 的 OKLab 距離 ≥ 0.05。低於它，讀者在沒有標籤的圖上把兩類讀成同一類。
  2026-08-19 量到三組未達（玫瑰／李 0.011、紅／李 0.035、玫瑰／紅 0.043），成因是三支
  擠在 356°–5° 這一段；2026-08-20 把李移到 315°（`#8a5f9e`，klimt.pop）、紅移到 22°
  （`#a44a4a`，yanzhi.accent），八支兩兩最近 0.050（綠／茶青，本來就是這個值），
  `KNOWN_CLOSE_PAIRS` 因此清空。再有未達門檻的組合就是直接失敗；要登記一組，
  在那裡寫明理由與什麼時候拿掉。
  紅與灰的位置不動有各自的理由：紅是 `--status-danger` 的來源，往 41° 移會與 amber
  的警告義撞在一起；灰是 `--cat-8`，統計站十來張圖拿它當估計值與區間的中性墨，
  讓它退出分類會把那些圖整批染色。
- 分類槽最多八支。本站彩度帶內、門檻 0.05 下等距排列，第九支掉到 0.046，`--cat-9`
  以上一律擋。

## 面積規則（2026-07-08 立、2026-08-16 再令全局底層）

- **深墨階（`-tx`、ink 系）禁止以大色塊出現**——只准點、細線、文字、圖例籤。
- 淡底階（`-bg`）不單獨當資料 mark（太淺讀不到）。
- accent 即使彩度合格也只准小面積（細框、連結、圖例點、小鉻件）。金箔漸層限文字筆畫。
- 長條填色用實色淡彩（color-mix 22–30%）＋頂端實色小蓋、無外框；禁「淺色塊＋外圈細線」。
- 一張圖只用一個色相；一個畫面最多一處撞色（pop）。

## 分類 mark（點陣、圖表點；2026-08-16 四輪裁定）

- 分類 mark 用 `MARK_TONES` 的中明度票（L≈0.74–0.79、C≈0.06–0.10）畫點、配圖例；
  **mark 上不標字**。token 槽 `--mark-1`〜`--mark-4`，順序照資料層分類表固定指派，
  篩選不重排；超過四類先重想圖。
- 單類資料（只講密度、節奏）用單色，不用分類色。
- 被否決過、不得回頭再試的：badge 深墨值直接當點（灰暗）、框架色（accent／accent2／
  pop）當 mark、驗證器生成的鮮豔組、外部名牌色票、mark 上標單字。

## 消費端紀律

- 各站一律 import 本包，禁止本地複製 `tokens.css`／`palettes.js`／validator 副本
  （phenom-iias 是正確模式）。釘版落後主版太多時升版要專案自查；歷史欠帳見
  canvas TODO 與 2026-08-16 的盤點（六站曾釘四代、三站曾有本地分叉）。

## 返回鍵（v0.1.30 起）

- **熱區是箭頭本身外擴 4px**，寫在 `BackLink.jsx` 的 `ZONE`：`p-1` 撐開、`-m-1` 抵回版面、
  `w-fit` 不撐滿整行，`group` 掛在這個 wrapper 上。**三個殼那一列不得掛 `group`**，掛了就
  變成游標掃過整條抬頭列都會讓箭頭浮出來。`scripts/validate-back-link-zone.mjs` 兩條都查，
  兩個故意寫壞的案例驗過會失敗。
- 靜置 opacity 0（`.phenom-back-link--quiet`）；hover、`focus-visible` 與觸控的第一次點各自
  讓它顯形。hover 色吃 `--backlink-accent`，沒設就用全站 accent。有自己色盤的站把這一行加進
  頁面級變數表，不要傳 class 進來。
- `className` 加在箭頭上，不整份替換樣式。落點由各站顯式傳 `back`，登記在
  `phenom-ops/infra/back-link.json`。

# 網頁字型的來源與權利

站主 2026-07-30 確認，本套件現有的網頁字型二進位檔都可以再散布、可以嵌在網頁上。
以下各檔取自 Canvas Lab 已入版控的字型包：

- `HuiwenMincho-core-subset.woff2` — 內文，繁體中文，常用面（覆蓋各站文字 99.9% 的字元出現次數，先到）。
- `HuiwenMincho-ext-subset.woff2` — 內文，繁體中文，其餘面（頁面出現罕用字時才下載；與常用面的聯集等於原本的全覆蓋子集）。
- `ChironSungHK-fallback-subset.woff2` — 繁體中文補字（依 unicode-range 補 Huiwen 畫不出的碼位）。
- `HuiwenMincho-anglebrackets.woff2` — 篇名號 U+3008、U+3009 的全形版本，由 `scripts/build-angle-bracket-face.mjs` 從同一支汇文母檔產生。汇文把這兩個碼位畫成半形（advance 512，em 1024），而它自己的《》「」（）都是全形，半形的角括號排在漢字之間會貼著相鄰的筆畫。輪廓一個點都不動，改的是 advance 與位移；`validate-font-subsets.mjs` 驗 CSS 會選中的那一面 advance 等於 em。
- `ErikasFarbband-subset.woff2` — 拉丁點綴，regular。2026-11-23 起為補字改作版，家族名 Erikas Farbband Phenom。
- `ErikasFarbband-Bold-subset.woff2` — 拉丁點綴，bold。同上。
- `RadioNewsman-subset.woff2` — 拉丁標題。2026-11-23 起為補字改作版，家族名 Radio Newsman Phenom。

三個拉丁面的檔名與 CSS 的 `font-family`（'Erikas Farbband'、'Radio Newsman'）未改，各站堆疊照舊；字型檔內 name 表的家族名改了。

## 子集覆蓋（2026-08-13）

Erikas 兩個字重原本帶的是 130 字的子集，照當時某一個站的文字產生。長音字母全部落在外面，
於是平文式羅馬字（`daimyō`、`taishōgun`、`bushidō`）的那個字母掉到字型堆疊的下一個面，
同一個詞裡半數是打字機體、長音那個是明體。兩個字重現在改成固定拉丁覆蓋，與內文面同一套
「子集一次、之後不因網站文字重建」的策略：收原檔落在 U+0020–024F、U+2000–206F、U+20A0–20BF
的全部碼位，共 340 個。原檔在擴充 B（U+0180–024F）只有 Ǽ ǽ Ǿ ǿ Ș ș ƒ ȷ 等 8 個，所以擴充 B
大部分不在覆蓋內；先前寫的「收到擴充 B」不確。

`scripts/validate-font-subsets.mjs` 逐個面驗「這個面自己畫得完常用拉丁字元」，畫不完就讓
套件的 validate 失敗。消費端自己的缺字檢查看不到這一類故障：它驗的是整個字型堆疊的聯集，
而缺的那個字母在內文面有字，聯集永遠通過。

來源字型 erikas-farbband.ttf 兩個字重都缺 U+0113 ē、U+014A Ŋ、U+014B ŋ 與 U+00A0；2026-11-23
起由補字版補上（見下節），覆蓋表不再留例外。

上游的姓名標示與各字型的授權摘要仍在 `LICENSES.md`。套件程式碼用 MIT，字型各自依上游條款。

## 補字改作版（2026-11-23）

來源字型 radio-newsman.ttf 只有 95 個碼位，全在 ASCII；Latin-1 補充、擴充 A、一般標點
（’ – —）都沒有，連 ASCII 的 `<`、`>`、反引號、`~` 也沒有。人文來風講者「Günter Wohlfart」的
標題用 `font-display`，ü 落到堆疊下一個面（汇文明體），詞內兩種字面。

站主 11-23 裁定以字型自己的字形組字補齊。產生腳本與參數、逐碼位組法在
`engineering/glyph-extension-20261123/`（`build_full.py`、`added-codepoints.tsv`、`index.md`）：

- Radio Newsman Phenom：補 239 個碼位，Latin-1 補充與擴充 A 全部、– — ‘ ’ ‚ “ ” „ … • ‹ ›、
  ASCII 原缺的 < > ` ~。附加符號由 period、quotesingle、hyphen、asciicircum、comma、o、s 縮放
  旋轉而成；ß ø æ œ ł ŋ ð þ 等以既有字形裁切、聯集另畫。OS/2 winAscent／winDescent 放大到涵蓋
  附加符號，hhea 與 typo 未動，標題行框不變。
- Erikas Farbband Phenom regular 與 bold：補 ē Ŋ ŋ 與 U+00A0。

同日撤回先前的做法（`--font-display` 堆疊在 Radio Newsman 之後插入 Erikas，ui-vue
`PageIdentity` 標題含 Radio Newsman 畫不出的字元時整行改走 font-accent 的 `displayFont.js`）。
`scripts/validate-font-subsets.mjs` 改為三個拉丁面一律驗 ASCII、Latin-1 補充、擴充 A 與常用標點，
以 cmap 判斷，不留例外表；`scripts/check-display-coverage.mjs` 掃人文來風建置資料裡會以
font-display 畫的文字（集名、段落標題、講者名、條目名），逐字讀標題字型的 cmap，缺字報出。

my-canvas-lab 的 `npm run fonts:rebuild` 仍從未補字的來源檔重建 Erikas，產物不可複製進本倉。

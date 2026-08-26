# 網頁字型的來源與權利

站主 2026-07-30 確認，本套件現有的網頁字型二進位檔都可以再散布、可以嵌在網頁上。
以下各檔取自 Canvas Lab 已入版控的字型包：

- `HuiwenMincho-core-subset.woff2` — 內文，繁體中文，常用面（覆蓋各站文字 99.9% 的字元出現次數，先到）。
- `HuiwenMincho-ext-subset.woff2` — 內文，繁體中文，其餘面（頁面出現罕用字時才下載；與常用面的聯集等於原本的全覆蓋子集）。
- `ChironSungHK-fallback-subset.woff2` — 繁體中文補字（依 unicode-range 補 Huiwen 畫不出的碼位）。
- `HuiwenMincho-anglebrackets.woff2` — 篇名號 U+3008、U+3009 的全形版本，由 `scripts/build-angle-bracket-face.mjs` 從同一支汇文母檔產生。汇文把這兩個碼位畫成半形（advance 512，em 1024），而它自己的《》「」（）都是全形，半形的角括號排在漢字之間會貼著相鄰的筆畫。輪廓一個點都不動，改的是 advance 與位移；`validate-font-subsets.mjs` 驗 CSS 會選中的那一面 advance 等於 em。
- `ErikasFarbband-subset.woff2` — 拉丁點綴，regular。
- `ErikasFarbband-Bold-subset.woff2` — 拉丁點綴，bold。
- `RadioNewsman-subset.woff2` — 拉丁標題。

## 子集覆蓋（2026-08-13）

Erikas 兩個字重原本帶的是 130 字的子集，照當時某一個站的文字產生。長音字母全部落在外面，
於是平文式羅馬字（`daimyō`、`taishōgun`、`bushidō`）的那個字母掉到字型堆疊的下一個面，
同一個詞裡半數是打字機體、長音那個是明體。兩個字重現在改成固定拉丁覆蓋——ASCII、Latin-1
補充、擴充 A 與 B，340 個碼位——與內文面同一套「子集一次、之後不因網站文字重建」的策略。

`scripts/validate-font-subsets.mjs` 逐個面驗「這個面自己畫得完常用拉丁字元」，畫不完就讓
套件的 validate 失敗。消費端自己的缺字檢查看不到這一類故障：它驗的是整個字型堆疊的聯集，
而缺的那個字母在內文面有字，聯集永遠通過。

三個碼位留在覆蓋之外，因為來源字型 erikas-farbband.ttf 本身就沒有：U+0113 ē、U+014A Ŋ、
U+014B ŋ。

上游的姓名標示與各字型的授權摘要仍在 `LICENSES.md`。套件程式碼用 MIT，字型各自依上游條款。

# 打字機字體補字（2026-11-23）

人文來風的標題用 font-display（Radio Newsman），來源字型只有 ASCII，講者名 Günter Wohlfart 的 ü 落到明體。站主 11-23 裁定以字型自己的字形組字補齊，Radio Newsman 與 Erikas Farbband 都補，改家族名並保留署名（Radio Newsman 下載站標 CC BY-ND 3.0，站主知悉改作風險）。先做樣張定參數，再做全量。

## 檔案

| 檔案 | 內容 | 進版控 |
|---|---|---|
| `build_full.py` | 全量產生腳本。從 Translation 倉 `_Assets/fonts/categories/typewriter-latin/` 讀三支原檔，輸出 `build/` 完整檔與 `../../fonts/` 三個 woff2 子集、`added-codepoints.tsv`；參數在檔首 `RN` 字典 | 是 |
| `added-codepoints.tsv` | 每個補入碼位：字型、碼位、字、組法（248 列） | 是 |
| `tails_variants.py`、`tails-variants.png`、`tails-variants.html` | 下加符號各版本對照（見「下加符號重做」） | 是 |
| `tails_d_sizes.py`、`tails-d-sizes.png`、`tails-d-sizes.html` | D 版三種尺寸對照，只渲染 | 是 |
| `render_full.py` | 以 headless Chrome 渲染 `specimen-full.png`、`zoom-full.png` | 是 |
| `specimen-full.png` | Radio Newsman 補入的 239 個字形，每組上排原字型、下排補字版；實際集名五組；Erikas 兩個字重補入的 ē Ŋ ŋ | 是 |
| `zoom-full.png` | ß ø æ œ ł、Œ Æ Ø Ł Ŋ ŋ ð þ ſ 放大，第三列是字型原有的 u B o l f e 與補入的 ü ö | 是 |
| `measure_line_box.py`、`line-box.html` | 補字前後同一標題的行框高度 | 是 |
| `probe/` | 探查用：`view.py` 把字形畫在 100 單位格線上（附 advance 線），`glyph-grid-source.png` 是原字型 24 個基字的座標格，`source-glyphs.png` 是原字型全部字形，`glyph-grid-iteration2.png` 是第二輪橫槓、ß、ð 的格線圖（之後又改過，見下節） | 是 |
| `build_composites.py`、`render.py`、`dot_variants.py`、`compare.png`、`zoom-u.png`、`dot-variants.png` | 樣張階段（只補 ü Ü ö ä é è ā ō ’ — 與 Erikas Bold 的 ē） | 是 |
| `RadioNewsmanPhenom-sample.ttf`、`ErikasFarbbandPhenom-Bold-sample.ttf` | 樣張字型；Bold 一支 2.7 MB | 否（`.gitignore`），重跑 `build_composites.py` 可得 |
| `build/*.ttf` | 補字完整檔 | 否，重跑 `build_full.py` 可得 |

## 重跑環境與命令

- Python 3.13 venv：`/opt/homebrew/bin/python3.13 -m venv .venv && .venv/bin/pip install fonttools==4.63.0 pillow==12.3.0 brotli skia-pathops==0.9.2`。skia-pathops 用來裁切與聯集輪廓；本機 pip 安裝約三分鐘。
- 補字與子集：`.venv/bin/python build_full.py`。兩次重跑產出的 woff2 位元組相同（讀原檔時 `recalcTimestamp=False`）。
- 投遞清單：回倉根跑 `node scripts/build-external-fonts.mjs`，更新 `fonts/external-manifest.json` 與 `src/fonts-external.css`。
- 樣張：`/opt/homebrew/bin/python3.13 render_full.py`；行框：`/opt/homebrew/bin/python3.13 measure_line_box.py`。兩支只用標準庫與 `/Applications/Google Chrome.app`。
- 檢查：`node scripts/validate-font-subsets.mjs`、`node scripts/check-display-coverage.mjs [人文來風 src/data/generated]`、`npm run validate`。

## 補字範圍

| 字型 | 補入 | 組法摘要 |
|---|---|---|
| Radio Newsman Phenom | 239 個：U+00A1–00FF 共 95 個（U+00A0 原檔已有）、U+0100–017F 共 128 個、標點 – — ‘ ’ ‚ “ ” „ … • ‹ › 12 個、ASCII 原缺的 < > ` ~ 4 個 | 帶符字母以 Unicode 分解取基字與附加符號；i、j 帶符時改用去點的 ı、ȷ。其餘逐字列在 `added-codepoints.tsv` |
| Erikas Farbband Phenom Regular、Bold | 各 4 個：ē、Ŋ、ŋ、U+00A0 | ē 取 ō 的長音輪廓疊到 e 上，網點用 e 自己的；Ŋ ŋ 取 n／N 去右腳底襯線，接 j 主輪廓的下鉤；U+00A0 對應 space |

站上 font-accent 兩個字重都用到（`styles-base.css` 的 `.font-accent` 與註標用 700），所以兩個字重都補。Erikas 子集的範圍照補字前（原檔落在 U+0020–024F、2000–206F、20A0–20BF 的碼位，原 340 個）再加補入的 4 個，未多收原檔的製表符與私用區，別站 font-accent 的字面不變。

## 組字參數（Radio Newsman，單位 1/1000 em）

| 項目 | 值 | 來源字形與變換 |
|---|---|---|
| 附加符號底緣 | 小寫 700；基字外框頂高於 770 者（大寫、升部字母、g 以外）900 | |
| 分音符、上點 | dot_scale 1.00、dot_half_gap 160（站主 11-23 選定） | period |
| 尖音、抑音 | 縮 0.60，轉 -22 度、+22 度 | quotesingle |
| 長音 | 橫 0.95、縱 0.62 | hyphen |
| 揚抑、抑揚（ˆ ˇ） | 橫 0.70、縱 0.48；ˇ 再轉 180 度 | asciicircum |
| 圈 | 縮 0.36 | o |
| 短音 | o 縮 0.50、0.45 後取下半 | o |
| 波浪 | s 轉 90 度，壓成寬 400、高 115 | s |
| 雙尖音 | 兩個尖音，中心距 ±95 | quotesingle |
| 下加符、反尾符（D 版，站主 11-23 選定） | j 的下鉤（裁 y<0）橫 0.42、縱 0.55，與基字底留白 20；反尾符左右鏡像、右緣距基字右緣 60 | j |
| 拉脫維亞語下逗號（Ģ Ķ Ļ Ņ Ŗ ķ ļ ņ ŗ） | comma 縮 0.60 置基字底下、留白 50；ģ 為 comma 縮 0.60 轉 180 度置上 | comma |
| ď ľ Ľ ť | ’ 縮 0.80 置於升部右上，advance 加寬 | comma |
| 橫槓、斜槓（Đ đ Ð Ħ ħ Ŧ ŧ Ł ł） | 伸出字幹兩側各 130；Ł ł 轉 30 度 | hyphen |
| Ø ø | slash 依 O、o 高放大 1.12、1.15 倍 | slash |
| — – | hyphen 兩端各 90 不動，中段拉長到總寬 1100、560（advance 1160、620）；樣張的 900 看起來仍像短橫 | hyphen |
| ’ | comma 上移 680 | comma |

另畫的字形（Unicode 分解組不出來）：ß 取長 s（f 去橫筆）接 B 右半在 y 640 以下的兩碗；ø Ø 見上；æ œ Æ Œ 取前字裁去右側後與 e、E 疊接；ł 見上；ŋ Ŋ 取 n、N 去右腳底襯線接 j 的下鉤；ð 取 six 左右翻轉縮 0.92 加斜槓；þ 取 p 加 l 的升部；Þ 取 P 字幹全高、碗縮到中段；ĸ 取 K 壓到 x 高；ſ 取 f 去橫筆；Ĳ ĳ ŉ Ŀ ŀ 為兩字併排；µ 取 u 接 p 的降部。符號（¡ ¿ ¢ £ ¤ ¥ ¦ § © ® ª º « » ¬ ° ± ² ³ ¹ ¶ · ¼ ½ ¾ × ÷）各自的組法見 `added-codepoints.tsv`。

## 下加符號重做（11-23 站主退回）

第一版的下加符（Ç ç Ş ş Ţ ţ ¸）、反尾符（Ą ą Ę ę Į į Ų ų）、下逗號（Ģ ģ Ķ ķ Ļ ļ Ņ ņ Ŗ ŗ）取整個 comma 等比 0.75、0.80，與基字同粗並黏在基字上，站主退回。參數改集中在 `build_full.py` 檔首 `TAILS` 字典，`tails_variants.py` 依各版本各產一份字型（`build/tails-*.ttf`，不進版控），與原字型（ç 落到明體）、第一版並排出 `tails-variants.png`。

| 版本 | 下加符、反尾符的來源 | 橫、縱縮放 | 與基字間距 | 下逗號縮放、留白 |
|---|---|---|---|---|
| A | 整個 comma | 0.50、0.62 | 25 | 0.60、40 |
| B | comma 裁去頭，只留 y<-20 的尾巴 | 1.00、1.00 | 15 | 0.60、60 |
| C | 同 B | 0.80、0.85 | -10（疊入 10，細點相連） | 0.55、40 |
| D | j 的下鉤（裁 y<0） | 0.42、0.55 | 20 | 0.60、50 |

間距量自基字外框底（yMin）；反尾符右緣距基字右緣 60。ģ 的上置倒逗號跟著下逗號的縮放。反尾符一律取來源字形左右鏡像。命令：`.venv/bin/python tails_variants.py`。

站主 11-23 選 D，參數照原樣（橫 0.42、縱 0.55、間距 20，下逗號 0.60、留白 50）。`TAILS["variant"]` 已設 D，`build_full.py`、`render_full.py`、`build-external-fonts.mjs` 已重跑，`fonts/` 出貨的子集與 `specimen-full.png` 為 D 版。

選定之後站主要看 D 的鉤子放大的樣子：`tails_d_sizes.py` 只渲染、不動出貨檔，出 `tails-d-sizes.png`，並排 D 原樣（0.42、0.55）、D 縱 0.70、D 橫 0.52 縱 0.70 三種，每種一行 Çç Ąą Ęę Įį Ųų Şş Ţţ 與一行 Jean-François · Garçon · Şişli，末列放大 ç ą ş。出貨仍是 D 原樣。

## 行距

hhea（ascent 910、descent -200）與 OS/2 typo 不動。補入的大寫附加符號頂到 1142、下逗號（D 版）到 -335，OS/2 usWinAscent 由 995 改為 1162、usWinDescent 由 276 改為 355（字形頂底再加 20），免得 Windows GDI 裁掉 Ü 的點。

| 行高 | 原字型行框 | 補字版行框 |
|---|---|---|
| 1.25（PageIdentity `leading-tight`） | 37.50 px | 37.50 px |
| normal | 42.00 px | 42.00 px |
| 1.375（`leading-snug`） | 41.25 px | 41.25 px |

D 版重產後重量一次，數值相同。`measure_line_box.py`，30 px 標題「我的博士導師、歐洲道家─Günter Wohlfart」，macOS Chrome。Windows 上 `line-height: normal` 的瀏覽器會讀 win 值，行框可能變高；人文來風的標題都設了數值行高，不受影響。Windows 實機尚未驗。

## 檢查與驗收（2026-11-23）

| 項目 | 命令 | 結果 |
|---|---|---|
| 子集覆蓋，正向 | `node scripts/validate-font-subsets.mjs` | exit 0，「4 個面，拉丁面與標題面各 328 字」 |
| 子集覆蓋，負向（複本） | 複本 fonts/ 裡從 Radio Newsman 子集刪 U+00FC、從 Erikas Bold 刪 U+0113 | exit 1，「標題面 Radio Newsman … 缺 1 個字元：ü (U+00FC)」「拉丁點綴面 bold … 缺 1 個字元：ē (U+0113)」 |
| 子集覆蓋，負向（複本） | 複本 fonts/ 換回補字前的子集 | exit 1，Erikas regular 報 U+00A0 ē Ŋ ŋ，Radio Newsman 報缺 237 個；原本跳過 Erikas 缺字的寫法已刪 |
| 人文來風標題資料，正向 | `node scripts/check-display-coverage.mjs` | exit 0，3203 筆標題文字、含拉丁字元 362 筆，ASCII 以外 7 種：á ç è ü – — … |
| 人文來風標題資料，負向 | 同上加 `--extra "Zhǎng Ǒ Ếxample"` | exit 1，報 ǎ（U+01CE）、Ǒ（U+01D1）、Ế（U+1EBE） |
| 舊子集對人文來風資料 | 暫時換回補字前的 Radio Newsman 子集 | 報 á（Bánh Xèo）、ç（Jean-François Marquet）、è 等 |
| 單元測試 | `node --test tests/display-coverage.test.mjs` | 3 項通過；判斷讀 fonts/ 的 woff2 cmap |
| 整套 | `npm run validate` | exit 0，tests 96、pass 96 |

審查紀錄（`phenom-renwen/engineering/font-accent-latin-20261123/index.md`「審查」節）列的「判準正則去掉 U+1E00–1EFF 照過」已無從發生：`displayFont.js` 與判準正則撤掉，檢查改為逐碼位讀 cmap。

## 撤回的舊修法

`packages/vue/src/composables/displayFont.js`、`displayFont.d.ts` 刪除，`index.ts` 的匯出、`PageIdentity.vue` 的 `displayTitleClass` 與 `styles-base.css` 在 `--font-display` 堆疊插入的 `'Erikas Farbband'` 都回到 ui-vue 0.6.3（52a5fd7）的寫法。撤回前在 `~/Documents` 與 `~/Desktop` 全範圍 grep `needsAccentDisplayFace|displayTitleClass|composables/displayFont`（只看 .js .mjs .ts .vue，排除 node_modules、dist、.git、套件打包的 core/）：命中的只有 phenom-ui main 工作樹的同一組檔案；1142 底下另有人文來風的工程紀錄與 my-canvas-lab 的 CHECKPOINT 以文字提及。`phenomcanvas-ui-vue-0.6.4.tgz` 只存在於本工作樹 `packages/vue/`，沒有消費站 vendor 它。

## 未決

- 上線前要由 phenom-ops 的 `upload-public-fonts.mjs` 把三個新 woff2 上傳到 assets.phenomcanvas.com；`external-manifest.json` 已指向新的 sha256 網址，上傳之前就打包發版，消費站會取不到字型。
- 本分支（site-home-link）與 main 分歧；main 的 de1b7bb（ui 0.1.74）仍帶 `--font-display` 插入的 Erikas 與舊判準檢查，要另外撤回或併入。
- 組出來的 ß、ð、Æ、ŋ 筆形較粗糙（ß 左上有 f 原本的突起，ŋ 右腳接 j 下鉤處有缺角），待站主看樣張。
- Windows 舊式渲染下的裁切與 `line-height: normal` 行框未實機驗。
- my-canvas-lab 的 `npm run fonts:rebuild` 仍從未補字的來源檔重建 Erikas，產物不要複製進本倉。
- `check-display-coverage.mjs` 不在 `npm run validate` 裡（它要讀人文來風的建置資料，CI 沒有那個倉），ui-vue 打包也不帶它與 woff2。人文來風自己的標題字型測試已在 d00ce36 撤回；資料哪天出現 ǎ 這類補字範圍外的字，目前沒有任何檢查會失敗，要在人文來風的 test 或 build 接一道（本次寫入範圍不含人文來風）。
- 字型檔內的家族名已改為 Phenom，但 CSS 的 `font-family`（'Radio Newsman'、'Erikas Farbband'）與出貨檔名照舊。skill `font-glyph-extension` 寫「不冒用原名發布」，CSS 名稱與檔名要不要跟著改，待站主決定；改了要動各站堆疊與 phenom-ops 的上傳清單。
- Erikas Bold 的 ŋ Ŋ 裁掉了右下角 y<110 範圍的網點，40 px 樣張看不出網格有沒有缺口，未放大核對。
- 本目錄原在 phenom-ui main 工作樹（未入版控），11-23 搬到 site-home-link 工作樹並提交；skill `font-glyph-extension` 記的路徑與「破折號 900 看起來像短橫」一條要跟著改。
- 授權：Erikas Farbband 檔內 name 表只有「GPL with font-exception AND OFL」，沒有 Reserved Font Name 字樣；上游 OFL.txt 未取得。

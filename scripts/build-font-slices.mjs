// 把內文明體切成「常用面」與「其餘面」，並印出要貼進 src/styles.css 的 unicode-range。
//
// 為什麼要切：原本 HuiwenMincho-subset.woff2 是一個 7.9 MB 的固定全覆蓋子集（約兩萬字）。
// 那個設計解決的是另一個問題——網站新增文字不必重建字型——代價是每個訪客的第一次到訪都要
// 下載 7.9 MB。2026-08-17 在 cc.phenomcanvas.com 量到：字型 258→3,885ms 才到齊，`swap` 於是
// 在三秒多之後把整頁重排一次，CLS 0.293（把字型擋掉只剩 0.002）。
//
// 切法保留原設計的性質：常用面與其餘面的聯集，等於原本那份全覆蓋子集，所以新文章照樣不必
// 重建字型；只是罕用字晚一點到。常用面的字表由十個站已建置的產物統計而來（scripts/
// font-core-chars.txt，隨腳本一起進版控），前 3,275 字就覆蓋 99.9% 的字元出現次數。
//
// CSS 的宣告順序：其餘面在前、不帶 unicode-range，常用面在後、帶顯式範圍。同一個家族裡
// 後宣告且範圍涵蓋該字的面優先，所以常用字用常用面、其餘字才落到另一面——而瀏覽器只在
// 頁面真的出現那些字時才下載它。
//
// 需要 pyftsubset（fonttools）與字型母庫；母庫在版控之外（授權未明的字型不進 repo）。
//   FONT_LIBRARY_ROOT=~/Documents/Font_Library node scripts/build-font-slices.mjs
// 加 --rescan 會重新統計常用字表（要各站的 dist 在旁邊），否則讀版控裡那份。
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT_LIBRARY_ROOT = process.env.FONT_LIBRARY_ROOT || join(homedir(), 'Documents/Font_Library');
const HUIWEN_SRC = join(FONT_LIBRARY_ROOT, 'fonts/HuiwenMincho-Improved.ttf');
const CORE_LIST = join(root, 'scripts/font-core-chars.txt');

if (!existsSync(HUIWEN_SRC)) {
  console.error(`來源字型不在：${HUIWEN_SRC}`);
  console.error('設 FONT_LIBRARY_ROOT 指向字型母庫再跑一次。');
  process.exit(1);
}

// 與各站字型產線同一份覆蓋目標（my-canvas-lab/scripts/font-chars.mjs 的 COVERAGE_RANGES）。
// 兩份要一致：這裡切出來的聯集就是那邊驗的全覆蓋。
const COVERAGE_RANGES = [
  [0x0020, 0x00ff], [0x0100, 0x024f], [0x0250, 0x02af], [0x02b0, 0x02ff],
  [0x0370, 0x03ff], [0x0400, 0x04ff], [0x0500, 0x052f],
  [0x2000, 0x209f], [0x20a0, 0x20cf], [0x2100, 0x214f], [0x2150, 0x218f], [0x2190, 0x21ff],
  [0x2200, 0x22ff], [0x2300, 0x23ff], [0x2460, 0x24ff],
  [0x2500, 0x257f], [0x2580, 0x259f], [0x25a0, 0x25ff], [0x2600, 0x26ff], [0x2700, 0x27bf],
  [0x2e00, 0x2e7f], [0x3000, 0x303f], [0x3040, 0x30ff], [0x3100, 0x312f], [0x31a0, 0x31bf],
  [0x3190, 0x319f], [0x3200, 0x32ff], [0x3400, 0x4dbf], [0x4e00, 0x9fff],
  [0xf900, 0xfaff], [0xfe10, 0xfe4f], [0xfe50, 0xfe6f], [0xff00, 0xffef],
];

const source = fontkit.openSync(HUIWEN_SRC);
const coverage = [];
for (const [lo, hi] of COVERAGE_RANGES) {
  for (let cp = lo; cp <= hi; cp += 1) if (source.hasGlyphForCodePoint(cp)) coverage.push(cp);
}

// 常用字表。掃各站建置產物統計字元出現次數，取到覆蓋 99.9% 為止；掃不到就用版控裡那份。
const rescan = process.argv.includes('--rescan');
const scanCorpus = () => {
  const siblings = ['phenom-court', 'phenom-wealth', 'phenom-notes', 'phenom-studies', 'phenom-iias',
    'my-canvas-lab', 'phenom-home', 'phenom-guzhun', 'phenom-chenyinke', 'phenom-zhujiahua']
    .map((name) => join(root, '..', name, 'dist')).filter(existsSync);
  if (siblings.length < 3) {
    console.error(`只找到 ${siblings.length} 個站的 dist，樣本太少，不重算字表`);
    process.exit(1);
  }
  const frequency = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(html|js|json)$/.test(entry.name) || statSync(full).size > 8e6) continue;
      for (const char of readFileSync(full, 'utf8')) {
        const cp = char.codePointAt(0);
        if (cp >= 0x2e80) frequency.set(cp, (frequency.get(cp) ?? 0) + 1);
      }
    }
  };
  for (const dist of siblings) walk(dist);
  const ranked = [...frequency.entries()].sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((sum, [, count]) => sum + count, 0);
  const picked = [];
  let accumulated = 0;
  for (const [cp, count] of ranked) {
    picked.push(cp);
    accumulated += count;
    if (accumulated / total >= 0.999) break;
  }
  console.log(`掃了 ${siblings.length} 個站，相異漢字 ${ranked.length}，取前 ${picked.length} 字（覆蓋 99.9% 的出現次數）`);
  return picked;
};

const coreFromCorpus = rescan || !existsSync(CORE_LIST)
  ? scanCorpus()
  : [...readFileSync(CORE_LIST, 'utf8').trim()].map((char) => char.codePointAt(0));
if (rescan || !existsSync(CORE_LIST)) {
  writeFileSync(CORE_LIST, `${coreFromCorpus.map((cp) => String.fromCodePoint(cp)).join('')}\n`);
}

// 常用面＝統計出來的常用漢字，加上覆蓋範圍裡所有非漢字的碼位（標點、假名、拉丁、符號，
// 加起來只有幾千個字，卻是每一頁都要用的）。
const isHan = (cp) => (cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0xf900 && cp <= 0xfaff);
const coverageSet = new Set(coverage);
const coreSet = new Set([...coverage.filter((cp) => !isHan(cp)), ...coreFromCorpus.filter((cp) => coverageSet.has(cp))]);
const extSet = coverage.filter((cp) => !coreSet.has(cp));

const toUnicodes = (codepoints) => codepoints.map((cp) => `U+${cp.toString(16).toUpperCase()}`).join(',');
const mergeRanges = (codepoints) => {
  const sorted = [...codepoints].sort((a, b) => a - b);
  const out = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (const cp of sorted.slice(1)) {
    if (cp === prev + 1) { prev = cp; continue; }
    out.push(start === prev ? `U+${start.toString(16)}` : `U+${start.toString(16)}-${prev.toString(16)}`);
    start = cp;
    prev = cp;
  }
  out.push(start === prev ? `U+${start.toString(16)}` : `U+${start.toString(16)}-${prev.toString(16)}`);
  return out.join(',');
};

const build = (name, codepoints) => {
  const out = join(root, 'fonts', name);
  execFileSync('pyftsubset', [
    HUIWEN_SRC,
    `--unicodes=${toUnicodes(codepoints)}`,
    '--layout-features=*',
    '--flavor=woff2',
    `--output-file=${out}`,
  ]);
  const kb = Math.round(statSync(out).size / 1024);
  console.log(`${name}  ${codepoints.length} 字  ${kb} KB`);
  return kb;
};

// 只要重算兩面的 unicode-range、不要重裁 woff2 時加 --ranges-only：重裁會換掉檔案的內容
// 雜湊，九個消費站的產物跟著全部換一輪，改 CSS 的範圍並不需要那個。
const rangesOnly = process.argv.includes('--ranges-only');
if (!rangesOnly) {
  build('HuiwenMincho-core-subset.woff2', [...coreSet]);
  build('HuiwenMincho-ext-subset.woff2', extSet);
}

const ranges = mergeRanges([...coreSet]);
writeFileSync(join(root, 'scripts/font-core-unicode-range.txt'), `${ranges}\n`);
console.log(`\n常用面的 unicode-range 已寫進 scripts/font-core-unicode-range.txt（${ranges.split(',').length} 段），貼進 src/fonts-local.css 的常用面宣告。`);

// 其餘面的實際範圍。CSS 那邊宣告的是三個漢字區塊（見 fonts-local.css 的註解：逐字列出要
// 4,535 段、40 KB，而其餘面實測只含漢字），這裡把實際範圍寫成檔案，並當場檢查那三塊還
// 涵蓋得住——換一支來源字型或改了 COVERAGE_RANGES，其餘面就可能長出漢字區塊以外的碼位，
// 而那種漏法在畫面上是「同一句話兩種字面」，不會報錯。
const extRanges = mergeRanges(extSet);
writeFileSync(join(root, 'scripts/font-ext-unicode-range.txt'), `${extRanges}\n`);
const DECLARED_EXT_BLOCKS = [[0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xf900, 0xfaff]];
const outsideBlocks = extSet.filter((cp) => !DECLARED_EXT_BLOCKS.some(([lo, hi]) => cp >= lo && cp <= hi));
console.log(`其餘面的實際範圍已寫進 scripts/font-ext-unicode-range.txt（${extRanges.split(',').length} 段，${extSet.length} 字）。`);
if (outsideBlocks.length > 0) {
  console.error(`\n其餘面有 ${outsideBlocks.length} 個碼位落在 fonts-local.css 宣告的三個漢字區塊之外：`
    + `${outsideBlocks.slice(0, 12).map((cp) => `U+${cp.toString(16).toUpperCase()}`).join(' ')}`);
  console.error('把 fonts-local.css 那一面的 unicode-range 改成涵蓋得住的範圍，或改用逐字列出的版本。');
  process.exit(1);
}
console.log('其餘面的碼位全部落在 fonts-local.css 宣告的三個漢字區塊內。');

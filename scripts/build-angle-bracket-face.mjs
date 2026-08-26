// 產生 fonts/HuiwenMincho-anglebrackets.woff2：篇名號 U+3008、U+3009 的全形版本。
//
// 汇文明朝体把這兩個碼位畫成半形（advance 512，em 1024），《》「」（）都是全形。
// 半形的角括號沒有兩側留白，排在漢字之間會貼著相鄰的筆畫（2026-08-27 站主在手記的
// 條目頁看到）。這一面只有兩個字，掛 unicode-range 宣告在 src/fonts-local.css 的
// 各面之後，接管這兩個碼位；其餘的字仍由常用面與其餘面供應。
//
// 字形的輪廓一個點都不動，改的是 advance 與位移，實際的手術在
// scripts/lib/angle_bracket_face.py。
//
// 需要 pyftsubset（fontTools）與字型母庫；母庫在版控之外（授權未明的字型不進 repo）。
//   FONT_LIBRARY_ROOT=~/Documents/Font_Library node scripts/build-angle-bracket-face.mjs
// 改完要跑 node scripts/build-external-fonts.mjs 重產外部版的 CSS 與 manifest。
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT_LIBRARY_ROOT = process.env.FONT_LIBRARY_ROOT || join(homedir(), 'Documents/Font_Library');
const HUIWEN_SRC = join(FONT_LIBRARY_ROOT, 'fonts/HuiwenMincho-Improved.ttf');
const OUT = join(root, 'fonts/HuiwenMincho-anglebrackets.woff2');
const HELPER = join(root, 'scripts/lib/angle_bracket_face.py');
const CODEPOINTS = [0x3008, 0x3009];

if (!existsSync(HUIWEN_SRC)) {
  console.error(`來源字型不在：${HUIWEN_SRC}`);
  console.error('設 FONT_LIBRARY_ROOT 指向字型母庫再跑一次。');
  process.exit(1);
}

/* 要的是「裝著 fontTools 的那個直譯器」，而 PATH 上的 python3 在這台機器不是它。
   pyftsubset 是 console script，第一行的 shebang 指的正是裝了 fontTools 的直譯器，
   所以從它反推；換機器就用 PHENOM_FONT_PYTHON 指定。 */
const resolvePython = () => {
  if (process.env.PHENOM_FONT_PYTHON) return process.env.PHENOM_FONT_PYTHON;
  let pyftsubset;
  try {
    pyftsubset = execFileSync('which', ['pyftsubset'], { encoding: 'utf8' }).trim();
  } catch {
    console.error('PATH 上沒有 pyftsubset：先裝 fontTools（pip install "fonttools[woff]"），或設 PHENOM_FONT_PYTHON。');
    process.exit(1);
  }
  const shebang = readFileSync(pyftsubset, 'utf8').split('\n', 1)[0];
  const match = /^#!\s*(\S+)/.exec(shebang);
  if (!match) {
    console.error(`讀不出 ${pyftsubset} 的直譯器，設 PHENOM_FONT_PYTHON 指定一個裝了 fontTools 的 python。`);
    process.exit(1);
  }
  return match[1];
};

const python = resolvePython();
execFileSync(python, [HELPER, HUIWEN_SRC, OUT], { stdio: 'inherit' });

/* 產生器自己驗一次產物：advance 沒有真的變成全形，這支就白跑了，而 CSS 那邊看不出來
   ——那個碼位照樣有字，只是還是窄的。 */
const face = fontkit.openSync(OUT);
const problems = [];
for (const codepoint of CODEPOINTS) {
  if (!face.hasGlyphForCodePoint(codepoint)) {
    problems.push(`U+${codepoint.toString(16).toUpperCase()} 不在產物裡`);
    continue;
  }
  const { advanceWidth } = face.glyphForCodePoint(codepoint);
  if (advanceWidth !== face.unitsPerEm) {
    problems.push(`U+${codepoint.toString(16).toUpperCase()} 的 advance 是 ${advanceWidth}，em 是 ${face.unitsPerEm}`);
  }
}
if (problems.length > 0) {
  console.error('產物不對：');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`fonts/HuiwenMincho-anglebrackets.woff2  ${CODEPOINTS.length} 字  ${statSync(OUT).size} bytes`);
console.log('接下來跑 node scripts/build-external-fonts.mjs，再 npm run validate。');

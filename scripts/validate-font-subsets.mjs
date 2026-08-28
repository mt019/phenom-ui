import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';

/*
 * 隨套件出貨的字型子集，畫得出該畫的字嗎？
 *
 * 2026-08-13 補上。原本沒有這道檢查，於是拉丁點綴面（Erikas Farbband）帶著一份 130 字的
 * 子集出貨了很多版：那是照當時某個站的文字產生的，只有 ASCII 與幾個重音字母。平文式
 * 羅馬字的長音 ō 不在裡面，寫 daimyō、taishōgun 的頁面就會半個詞掉到堆疊下一個字型（明體），
 * 一個詞兩種字面。消費端的缺字檢查抓不到——那種檢查看的是「整個字型堆疊畫得出來」，而
 * ō 在內文字型有字，聯集永遠是通過的。所以判準要放在這裡，而且是「同一個面畫得完」。
 *
 * 兩個面各自的門檻不同：
 *  - 拉丁點綴面：常用拉丁字元（ASCII＋西歐重音＋擴充 A 的長音字母）全部要有，來源字型
 *    本身就沒有的碼位逐一列在 SOURCE_GAPS 並寫明理由。
 *  - 內文面：CJK 是固定全覆蓋子集，這裡只放一組煙霧測試（常用漢字、假名、全形標點、
 *    數學與箭頭），真正的逐字驗證在各消費站的 validate:fonts。
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const font = (file) => fontkit.openSync(path.join(root, 'fonts', file));

const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => String.fromCodePoint(lo + i));

// 來源字型 erikas-farbband.ttf 本身沒有的碼位，重建也生不出來。
// U+0113 ē：日文羅馬字的長音 e 寫作 ei，用不到；拉脫維亞語等才需要。
// U+014A/U+014B Ŋŋ：非洲語言與國際音標。
const SOURCE_GAPS = new Set([0x0113, 0x014a, 0x014b]);

const LATIN_REQUIRED = [
  ...range(0x0020, 0x007e), // ASCII 可見字元
  ...range(0x00c0, 0x00ff), // 西歐重音字母
  ...range(0x0100, 0x017f), // 擴充 A：ā ē ī ō ū 長音、č š ž
].filter((c) => !SOURCE_GAPS.has(c.codePointAt(0)));

const CJK_SMOKE = [...'德川日本一二三四五六七八九十的是在了不和有大這中人上為個國我以要他時來用們生到作地於出就分對成會可主發年動'
  + 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'
  + 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
  + '（）「」『』〈〉《》、。，：；？！…—－·×÷≤≥≈→←↑↓∈∑'];

/* 拉丁點綴的兩個字重各自成一個面：缺字就是同一個詞裡換字型，所以逐檔驗。
   內文則是一個家族兩個檔（Huiwen 帶字，Chiron 依 unicode-range 補 Huiwen 畫不出的碼位），
   同一個家族名之下對讀者是一種字，所以驗聯集。 */
const FACES = [
  { files: ['ErikasFarbband-subset.woff2'], label: '拉丁點綴面 regular', required: LATIN_REQUIRED },
  { files: ['ErikasFarbband-Bold-subset.woff2'], label: '拉丁點綴面 bold', required: LATIN_REQUIRED },
  {
    files: ['HuiwenMincho-core-subset.woff2', 'HuiwenMincho-ext-subset.woff2', 'ChironSungHK-fallback-subset.woff2'],
    label: '內文家族（Huiwen 常用面＋其餘面＋Chiron 補字）',
    required: CJK_SMOKE,
  },
];

const problems = [];
for (const face of FACES) {
  const loaded = face.files.map(font);
  const missing = face.required.filter(
    (c) => !loaded.some((f) => f.hasGlyphForCodePoint(c.codePointAt(0))),
  );
  if (missing.length > 0) {
    const codes = missing.slice(0, 12)
      .map((c) => `${c} (U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')})`)
      .join(' ');
    problems.push(`${face.label}（${face.files.join('、')}）缺 ${missing.length} 個字元：${codes}`);
  }
}

/*
 * 全形標點得是全形。
 *
 * 2026-08-27 補上。汇文明朝体把篇名號 U+3008、U+3009 畫成半形（advance 512，em 1024），
 * 而《》「」（）都是全形，於是〈魔鬼夜訪錢鍾書先生〉的兩個角括號貼著相鄰的漢字筆畫。
 * 上面那組煙霧測試看的是「畫不畫得出來」，半形照樣通過，所以缺的是這一道。
 *
 * 量的是「CSS 會選中哪一面」，不是「隨便哪一面有字就算」：三個內文面同屬 Huiwen Mincho
 * 家族，unicode-range 涵蓋該碼位者之中後宣告的勝出。新的全形面若漏掉沒出貨，舊的半形面
 * 照樣有字，只驗聯集的檢查會通過而讀者看到的仍是半形。
 */
const FONTS_CSS = path.join(root, 'src/fonts-local.css');
const FULLWIDTH_REQUIRED = [...'〈〉《》「」『』（）、。'];

/** 讀 fonts-local.css，回傳 Huiwen Mincho 家族各面的檔名與 unicode-range，順序即宣告順序。 */
export function huiwenFaces(css) {
  const faces = [];
  for (const [, body] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    if (!/font-family:\s*'Huiwen Mincho'/.test(body)) continue;
    const file = /url\('\.\.\/fonts\/([A-Za-z0-9._-]+\.woff2)'\)/.exec(body)?.[1];
    if (!file) continue;
    const rangeText = /unicode-range:\s*([^;]+);/.exec(body)?.[1];
    const ranges = rangeText
      ? rangeText.split(',').map((part) => {
        const [lo, hi] = part.trim().replace(/^U\+/i, '').split('-');
        return [parseInt(lo, 16), parseInt(hi ?? lo, 16)];
      })
      : null;
    faces.push({ file, ranges });
  }
  return faces;
}

/** CSS 會選中的那一面：unicode-range 涵蓋該碼位者之中，最後宣告且真的有字的那一個。 */
export function winningFace(faces, codepoint, open = font) {
  const candidates = faces.filter(
    ({ ranges }) => ranges === null || ranges.some(([lo, hi]) => codepoint >= lo && codepoint <= hi),
  );
  for (const candidate of candidates.reverse()) {
    const loaded = open(candidate.file);
    if (loaded.hasGlyphForCodePoint(codepoint)) return { ...candidate, loaded };
  }
  return null;
}

const cssText = readFileSync(FONTS_CSS, 'utf8');
const faces = huiwenFaces(cssText);
if (faces.length === 0) problems.push(`${FONTS_CSS} 裡找不到任何 Huiwen Mincho 的 @font-face`);
for (const character of FULLWIDTH_REQUIRED) {
  const codepoint = character.codePointAt(0);
  const label = `${character}（U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}）`;
  const winner = winningFace(faces, codepoint);
  if (!winner) {
    problems.push(`全形標點 ${label} 在內文家族的任何一面都沒有字`);
    continue;
  }
  const { advanceWidth } = winner.loaded.glyphForCodePoint(codepoint);
  if (advanceWidth !== winner.loaded.unitsPerEm) {
    problems.push(
      `全形標點 ${label} 由 ${winner.file} 供應，advance ${advanceWidth}，em ${winner.loaded.unitsPerEm}`,
    );
  }
}

/* 負向測試：未改過的常用面單獨拿來量，U+3008 要報半形。報不出來就表示上面那段的量法
   壞了（或是換了一支來源字型），而它壞掉的樣子與「一切正常」一模一樣。 */
{
  const core = font('HuiwenMincho-core-subset.woff2');
  const { advanceWidth } = core.glyphForCodePoint(0x3008);
  if (advanceWidth >= core.unitsPerEm) {
    problems.push('全形檢查的負向測試不過：常用面的 U+3008 應該是半形，實際不是');
  }
}

/*
 * 其餘面宣告的 unicode-range 要涵蓋它實際含有的每一個碼位。
 *
 * 2026-08-28 補上。在此之前那一面不帶 unicode-range，等於宣告 U+0-10FFFF，於是頁面上
 * 任何一個常用面沒有的碼位都會去取 5.6 MB，包括它畫不出來的 emoji（實測：手記 72 頁裡
 * 65 頁因為側欄一個 U+1F411 而下載它，下載完仍然落回系統 emoji）。改成三個漢字區塊之後，
 * 反過來的風險是宣告漏掉了它真的有的字——那種漏法不會報錯，只會讓那個字安靜地掉到堆疊
 * 下一個字型，同一句話兩種字面。所以這裡驗的是涵蓋，不是相等：宣告的範圍可以比實際內容
 * 寬（區塊裡 Huiwen 畫不出的碼位由 Chiron 那一面接走），不可以比它窄。
 */
{
  const extFile = 'HuiwenMincho-ext-subset.woff2';
  const extFace = faces.find((face) => face.file === extFile);
  if (!extFace) {
    problems.push(`fonts-local.css 裡找不到 ${extFile} 的 @font-face`);
  } else if (!extFace.ranges) {
    problems.push(`${extFile} 沒有宣告 unicode-range，等於涵蓋 U+0-10FFFF：任何一個常用面`
      + '沒有的碼位都會下載這一面，包括它畫不出來的 emoji');
  } else {
    const loaded = font(extFile);
    const declared = (codepoint) => extFace.ranges.some(([lo, hi]) => codepoint >= lo && codepoint <= hi);
    // characterSet 帶著 cmap format 4 結尾那個對到 .notdef 的哨位段（三個內文面都回報
    // U+FFFF，而三個面的 hasGlyphForCodePoint(0xFFFF) 都是 false），所以只看真的有字圖的碼位。
    const outside = [...loaded.characterSet]
      .filter((codepoint) => loaded.hasGlyphForCodePoint(codepoint) && !declared(codepoint));
    if (outside.length > 0) {
      const codes = outside.slice(0, 12).map((cp) => `U+${cp.toString(16).toUpperCase()}`).join(' ');
      problems.push(`${extFile} 有 ${outside.length} 個碼位落在它宣告的 unicode-range 之外，`
        + `這些字會掉到堆疊下一個字型：${codes}`);
    }
  }
}

if (problems.length > 0) {
  console.error('字型子集覆蓋不足：');
  for (const p of problems) console.error(`  ${p}`);
  console.error('\n這些字元在別的字型有，所以消費端的缺字檢查不會報——壞的是字面一致性：');
  console.error('缺的那個字母會掉到堆疊下一個字型，半個詞不是這個面的字。');
  console.error('→ 缺字：在有來源字型的機器上重建子集（my-canvas-lab 的 npm run fonts:rebuild），把產物複製過來。');
  console.error('→ 全形標點的 advance 不對：跑 node scripts/build-angle-bracket-face.mjs，再跑 node scripts/build-external-fonts.mjs。');
  process.exit(1);
}

console.log(`字型子集覆蓋通過：${FACES.length} 個面，拉丁面各 ${LATIN_REQUIRED.length} 字、內文面煙霧測試 ${CJK_SMOKE.length} 字、全形標點 ${FULLWIDTH_REQUIRED.length} 字。`);

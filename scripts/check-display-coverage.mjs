import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as fontkit from 'fontkit';

/*
 * 標題字型（font-display，Radio Newsman Phenom）畫得完某個站實際的標題文字嗎？
 *
 * 2026-11-23 補上。Radio Newsman 的來源字型只有 ASCII，人文來風講者 Günter Wohlfart 的 ü
 * 落到明體；補字版收了 Latin-1 補充、擴充 A 與常用標點。補字範圍是固定的，資料裡哪天出現
 * 拼音聲調（ǎ）或越南文（ế），這裡要報出來。判斷一律讀字型檔的 cmap，不寫死覆蓋表。
 *
 * 用法：node scripts/check-display-coverage.mjs [資料目錄] [--extra 文字 ...]
 *   資料目錄預設為與本倉同層的 phenom-renwen/src/data/generated（人文來風建置時由
 *   prepare-data 產生）。--extra 把額外文字當成一筆標題一起掃，供負向測試用。
 * 掃的欄位：集名、集全名、段落標題、講者名、條目名、卷季標題——都是 font-display 會畫的字。
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DISPLAY_FONT_FILE = path.join(root, 'fonts', 'RadioNewsman-subset.woff2');

/** 需要由標題字型畫出的字元：拉丁字母（含帶符字母）與拉丁文排版用的標點。 */
export function needsDisplayGlyph(ch) {
  if (/\p{Script=Latin}/u.test(ch) && /\p{L}/u.test(ch)) return true; // 羅馬數字 Ⅰ 屬 Nl，由明體畫
  return /[–—‘’‚“”„…]/u.test(ch);
}

/** 從人文來風的建置資料取出 font-display 會畫的文字，回傳 [{ kind, text }]。 */
export function displayTexts(dataDir) {
  const out = new Map();
  const add = (kind, text) => {
    if (typeof text === 'string' && text.trim()) out.set(`${kind}\u0000${text}`, { kind, text });
  };
  const json = (rel) => JSON.parse(readFileSync(path.join(dataDir, rel), 'utf8'));
  const catalog = json('catalog.json');
  for (const e of catalog.episodes ?? []) {
    add('集名', e.title);
    add('集全名', e.fullTitle);
    (e.speakers ?? []).forEach((s) => add('講者', s));
    (e.sections ?? []).forEach((s) => add('段落標題', s.title));
  }
  const walkTitles = (node) => {
    if (Array.isArray(node)) node.forEach(walkTitles);
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if ((k === 'title' || k === 'name' || k === 'label') && typeof v === 'string') add('卷季', v);
        else walkTitles(v);
      }
    }
  };
  walkTitles(catalog.volumes);
  const speakersDir = path.join(dataDir, 'speakers');
  if (existsSync(speakersDir)) {
    for (const f of readdirSync(speakersDir)) {
      if (f.endsWith('.json')) Object.keys(json(`speakers/${f}`)).forEach((n) => add('講者', n));
    }
  }
  const termsDir = path.join(dataDir, 'terms');
  if (existsSync(termsDir)) {
    for (const t of json('terms/list.json')) add('條目', t.name);
    for (const f of readdirSync(termsDir)) {
      if (f.startsWith('shard-')) for (const t of Object.values(json(`terms/${f}`))) add('條目', t?.name);
    }
  }
  return [...out.values()];
}

/** 逐字檢查；回傳 { latinTexts, chars, missing: Map(碼位 → [樣本]) }。 */
export function checkCoverage(texts, font = fontkit.openSync(DISPLAY_FONT_FILE)) {
  const missing = new Map();
  const chars = new Set();
  let latinTexts = 0;
  for (const { kind, text } of texts) {
    let latin = false;
    for (const ch of text) {
      if (!needsDisplayGlyph(ch)) continue;
      latin = true;
      const cp = ch.codePointAt(0);
      chars.add(cp);
      if (!font.hasGlyphForCodePoint(cp)) {
        if (!missing.has(cp)) missing.set(cp, []);
        const list = missing.get(cp);
        if (list.length < 3) list.push(`${kind}：${text.slice(0, 50)}`);
      }
    }
    if (latin) latinTexts += 1;
  }
  return { latinTexts, chars, missing };
}

const hex = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const extras = [];
  let dataDir = path.resolve(root, '..', 'phenom-renwen', 'src', 'data', 'generated');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--extra') extras.push(args[++i]);
    else dataDir = path.resolve(args[i]);
  }
  if (!existsSync(path.join(dataDir, 'catalog.json'))) {
    console.error(`${dataDir} 沒有 catalog.json：先在人文來風跑 npm run data，或把資料目錄當第一個參數傳進來。`);
    process.exit(2);
  }
  const texts = displayTexts(dataDir);
  extras.forEach((text) => texts.push({ kind: '額外', text }));
  const problems = [];
  if (texts.length < 500) problems.push(`只掃到 ${texts.length} 筆標題文字（預期 500 以上），資料目錄結構可能變了`);
  const { latinTexts, chars, missing } = checkCoverage(texts);
  if (latinTexts < 20) problems.push(`含拉丁字母的標題只有 ${latinTexts} 筆（預期 20 以上），檢查沒有看到該看的東西`);
  for (const [cp, samples] of [...missing].sort((a, b) => a[0] - b[0])) {
    problems.push(`${String.fromCodePoint(cp)}（${hex(cp)}）標題字型沒有字：${samples.join('；')}`);
  }
  const nonAscii = [...chars].filter((cp) => cp > 0x7e).sort((a, b) => a - b);
  console.log(`掃描 ${texts.length} 筆標題文字，含拉丁字元 ${latinTexts} 筆；字元 ${chars.size} 種，`
    + `ASCII 以外 ${nonAscii.length} 種：${nonAscii.map((cp) => `${String.fromCodePoint(cp)} ${hex(cp)}`).join('、') || '無'}`);
  if (problems.length > 0) {
    console.error('標題字型覆蓋不足：');
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`標題字型 ${path.basename(DISPLAY_FONT_FILE)} 畫得完全部標題文字。`);
}

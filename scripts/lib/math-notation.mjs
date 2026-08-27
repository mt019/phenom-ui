/*
 * 數學記號的固定檢查——站群唯一一份。
 *
 * 在有數學的頁面上，數學符號只能以 LaTeX 進來：.mdx 寫 $…$／$$…$$，JSX 寫
 * <Math tex="…" />。直接鍵入 Unicode 字元（α、H₀、σ）會用明體畫它，而旁邊的公式走
 * KaTeX_Math，同一個符號在同一頁上出現兩種字形，還把希臘字母與數學區段拖進字型子集。
 *
 * 掃描範圍由呼叫端給。各站要掃的頁面不同，寫死在共用層就會出現「掃別站的頁面清單」
 * ——三個 studies fork 的副本掃的正是 canvas 的統計站頁面，那些頁面在它們倉裡不存在。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// 希臘字母、上下標、數學運算子。
const BANNED = /[Ͱ-Ͽ⁰-₟∀-⋿]/u;

// 成對的 ⋯⋯（U+22EF ×2）是中文刪節號，是標點不是數學。它落在「數學運算子」區段純屬
// Unicode 分區的結果——…（U+2026）在明體裡貼著基線，置中的那一個就是 ⋯，中文排版本來
// 就用它。豁免按字元用途切、不按目錄切。單獨一個 ⋯ 仍然攔——那才可能是 a₁, ⋯, aₙ。
const CJK_ELLIPSIS = /⋯{2,}/gu;

/*
 * 資料層的欄位若帶 $…$，前端要有元件把它編譯出來。.mdx 的散文在建置時走 remark-math，
 * 而 JSON 字串直接印進 JSX 會顯示原文（$2^k$），洗牌那篇的測驗選項就是這樣上線的。
 * 下列欄位都由 <MathText> 渲染；新欄位帶 LaTeX 就會在這裡失敗，直到它被接上。
 */
const DEFAULT_MATH_RENDERED_FIELDS = [
  'prompt', 'options', 'explain',   // Quiz.jsx
  'statement', 'claim', 'why', 'instead', // StatementsPanel.jsx
  'caption',                        // ChartFrame.jsx
  'locator',                        // HoverCite.jsx, AnnotatedHtml.jsx
  // 寫給資料倉自己的文件，以及自帶 JSX 圖說的圖表元件；不會被當成裸字串印出來。
  'description', 'notes', 'source', 'title', 'label',
];

/*
 * 獨立成行的公式要把 $$ 各自放在自己的一行。remark-math 把一行的 `$$…$$` 讀成行內數學，
 * 於是它排在段落裡：靠左、正文行高、沒有 .katex-display 外框，也沒有 katex.css 給它的間距。
 */
const ONE_LINE_DISPLAY = /^\s*\$\$.*\S.*\$\$\s*$/;

function walk(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true })
    .flatMap((entry) => walk(join(path, entry.name)));
}

function fieldsWithLatex(value, key, out, rendered) {
  if (typeof value === 'string') {
    if (/\$[^$\n]+\$/.test(value) && !rendered.has(key)) out.add(key);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) fieldsWithLatex(item, key, out, rendered);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) fieldsWithLatex(v, k, out, rendered);
  }
}

/**
 * @param {object} opts
 * @param {string[]} opts.roots            掃 Unicode 數學字元的目錄或檔案
 * @param {string[]} [opts.dataDirs]       另外掃「$…$ 有沒有人渲染」的資料目錄（.json）
 * @param {string[]} [opts.allowFields]    追加的已渲染欄位名
 */
export function checkMathNotation({ roots, dataDirs = [], allowFields = [] }) {
  if (!Array.isArray(roots) || roots.length === 0) throw new Error('math-notation：缺少 roots');
  const rendered = new Set([...DEFAULT_MATH_RENDERED_FIELDS, ...allowFields]);

  const files = roots.flatMap(walk);
  const problems = [];
  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      const scan = line.replace(CJK_ELLIPSIS, '');
      const hits = [...new Set([...scan].filter((c) => BANNED.test(c)))];
      if (hits.length > 0) problems.push({ file, line: i + 1, hits: hits.join(' ') });
    });
  }

  const inlineDisplay = [];
  for (const file of files.filter((f) => f.endsWith('.mdx'))) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (ONE_LINE_DISPLAY.test(line)) inlineDisplay.push({ file, line: i + 1 });
    });
  }

  const dataFiles = dataDirs.flatMap((dir) => (existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f))
    : []));
  const unrendered = [];
  for (const file of [...files.filter((f) => f.endsWith('.json')), ...dataFiles]) {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    const out = new Set();
    fieldsWithLatex(parsed, '', out, rendered);
    for (const key of out) unrendered.push({ file, key });
  }

  return { problems, inlineDisplay, unrendered, checked: files.length, dataChecked: dataFiles.length };
}

/** 各倉的閘照這支跑。 */
export function runMathNotation(opts) {
  const { problems, inlineDisplay, unrendered, checked, dataChecked } = checkMathNotation(opts);

  if (checked === 0) {
    console.error(`數學記號檢查一個檔案都沒讀到（掃描根 ${opts.roots.join('、')}），檢查沒有實際執行。`);
    process.exit(1);
  }
  if (inlineDisplay.length > 0) {
    console.error('獨立成行的公式要把 $$ 各自放在自己的一行，中間才是式子；寫成一行的 $$…$$ 會被當成行內數學，靠左貼著段落排。');
    console.error('以下位置要拆成三行：\n');
    for (const d of inlineDisplay) console.error(`  ${d.file}:${d.line}`);
    process.exit(1);
  }
  if (unrendered.length > 0) {
    console.error('資料層有欄位含 $…$，但前端沒有用 <MathText> 渲染它，讀者會看到 LaTeX 原文。');
    console.error('把該欄位接上 MathText.jsx，再把欄名加進呼叫端的 allowFields：\n');
    for (const u of unrendered) console.error(`  ${u.file}  欄位 ${u.key || '(頂層)'}`);
    process.exit(1);
  }
  if (problems.length > 0) {
    console.error('數學記號必須寫成 LaTeX：.mdx 用 $…$，JSX 用 <Math tex="…" />。');
    console.error('以下位置直接打了 Unicode 數學字元：\n');
    for (const p of problems) console.error(`  ${p.file}:${p.line}  ${p.hits}`);
    console.error(`\n共 ${problems.length} 處。理由見 DESIGN.md 的 KaTeX 例外。`);
    process.exit(1);
  }
  console.log(`math notation ok — ${checked} 個檔案掃字元、${dataChecked} 個資料檔掃未渲染的 $…$`);
}

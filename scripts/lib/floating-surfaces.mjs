// 浮層寫法的固定檢查——站群唯一一份。
//
// 內容型浮層一律由掛名的產生者開 portal，不得寫回父層 absolute/group-hover。獲准的產生者
// 不等於免檢：每一個都要逐項驗核心行為（portal、點外關閉、Esc 關閉、定位、單次只開一張），
// 定位的視窗避讓在共用的 useFloatingCard。
//
// 2026-08-27 收斂：套件原本那份只驗一組固定的 needle，canvas 那份逐產生者列規格且讀不到
// 檔案時報錯。兩份合成一份，判準取較嚴的 canvas 版。
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DEFAULT_ROOTS = ['src/pages', 'src/components'];
const HOVER_CARD = 'src/components/lab/HoverCard.jsx';
// AnnotatedHtml 是第二個獲准的產生者：它的註標在 dangerouslySetInnerHTML 進來的 HTML 裡，
// 只能事件委派＋自己開 portal，包不進 HoverCard 的子元件寫法。所以它不走白名單放行，
// 而是照 HoverCard 的規格逐項驗核心行為。定位與避讓在共用的 useFloatingCard.js。
const ANNOTATED_HTML = 'src/components/lab/AnnotatedHtml.jsx';
const FLOATING_HOOK = 'src/components/lab/useFloatingCard.js';

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

// 每個獲准的產生者都要具備同一組核心行為。needle 給陣列表示「其中一種寫法即可」——
// viewport 避讓有兩種正當實作：自己內嵌夾擠（canvas 的 HoverCard），或交給共用的
// useFloatingCard（套件的 HoverCard）。兩者都是真的有做，只列一種會把另一種誤判成缺。
const PRODUCERS = [
  [HOVER_CARD, [
    ['createPortal(', 'portal 脫離裁切層'],
    ["document.addEventListener('pointerdown'", '點外關閉'],
    ["e.key === 'Escape'", 'Esc 關閉'],
    [['window.innerWidth - cardW - GAP', 'useFloatingCard('], 'viewport 左右避讓'],
    ['closeActiveCard', '單次只開一張'],
  ]],
  [ANNOTATED_HTML, [
    ['createPortal(', 'portal 脫離裁切層'],
    ["document.addEventListener('pointerdown'", '點外關閉'],
    ["event.key === 'Escape'", 'Esc 關閉'],
    ['useFloatingCard(', '定位交給共用 useFloatingCard'],
    ['const [active, setActive]', '單一 active 狀態，單次只開一張'],
  ]],
  [FLOATING_HOOK, [
    ['window.innerWidth - cardW - CARD_GAP', 'viewport 左右避讓'],
  ]],
];

/**
 * @param {object} [opts]
 * @param {string[]} [opts.roots]           掃描根，預設 src/pages 與 src/components
 * @param {string}   [opts.prefix]          掃描根的前綴（套件自己驗時要指到自己的 src）
 * @param {string}   [opts.producerPrefix]  產生者路徑的前綴，不給就同 prefix。倉自己沒有
 *                                          HoverCard、以 node_modules 那份為準時要指過去
 *                                          （phenom-court 的內容型浮層全部來自共用包）。
 */
export function checkFloatingSurfaces({ roots = DEFAULT_ROOTS, prefix = '', producerPrefix = prefix } = {}) {
  const present = roots.filter((root) => existsSync(join(prefix, root)));
  const files = present.flatMap((root) => walk(join(prefix, root))).filter((path) => /\.(jsx|tsx)$/.test(path));
  const failures = [];

  const producerPaths = new Set(PRODUCERS.map(([file]) => join(producerPrefix, file)));
  for (const path of files) {
    const source = readFileSync(path, 'utf8');
    const rel = relative('.', path);
    if (/group-hover(?:\/[\w-]+)?:block/.test(source)) {
      failures.push(`${rel}：禁止以 group-hover:block 顯示浮層，改用 HoverCard portal`);
    }
    // 產生者以外的檔案一律不得自己寫 tooltip role。
    if (!producerPaths.has(path) && /role=["']tooltip["']/.test(source)) {
      failures.push(`${rel}：tooltip role 只能由共用 HoverCard／AnnotatedHtml 產生`);
    }
  }

  for (const [file, needles] of PRODUCERS) {
    const path = join(producerPrefix, file);
    let source;
    try {
      source = readFileSync(path, 'utf8');
    } catch {
      // 檔案被搬走時要當成失敗；直接跳過等於底下的行為完全沒檢查到。
      failures.push(`讀不到 ${path}，改共用層的產生者清單`);
      continue;
    }
    for (const [needle, label] of needles) {
      const accepted = Array.isArray(needle) ? needle : [needle];
      if (!accepted.some((text) => source.includes(text))) {
        failures.push(`${path} 缺少核心行為：${label}`);
      }
    }
  }

  return { failures, checked: files.length, roots: present };
}

/** 各倉的閘照這支跑。 */
export function runFloatingSurfaces(opts) {
  const { failures, checked, roots } = checkFloatingSurfaces(opts);
  if (checked === 0) {
    console.error(`浮層檢查一個檔案都沒讀到（掃描根 ${roots.join('、') || '全部不存在'}），檢查沒有實際執行。`);
    process.exit(1);
  }
  if (failures.length) {
    console.error(`floating surface validation failed:\n${failures.map((line) => `- ${line}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`floating surfaces ok: ${checked} 個頁面／元件檔案，內容型浮層統一由 HoverCard 管理`);
}

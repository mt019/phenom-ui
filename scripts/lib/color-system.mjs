/*
 * 色彩系統的判定——站群唯一一份。
 *
 * 2026-08-20 之前，這段判定在五個倉各有一份副本（my-canvas-lab、phenom-ui、
 * phenom-guzhun、phenom-chenyinke、phenom-zhujiahua），其中四份彼此逐位元組相同、
 * 與母本差一段分類 mark 的檢查——也就是說 mark 那條規則四個倉都沒有在跑。
 * 各倉的閘改成呼叫本模組之後，共用層加一條規則，各倉下一次執行就吃得到。
 *
 * 帶寬與門檻的正本在 ../src/styles/oklch.js，前端的色票庫與色彩原理頁讀的是同一份。
 *
 * 判定的內容：tokens.css 的 Layer 0（--tone-<名>-<tx|bg>）是這套系統的唯一真實來源，
 * 語意層（--status-*、--cat-*）都是 var() 別名。墨色的明度與彩度、淡底的近白程度、
 * 明度極差、tx 與 bg 成對、分類槽的上限、兩支墨色的感知距離，逐項在這裡查。
 */
import { readFileSync, existsSync } from 'node:fs';
import { hexToOklch, oklabDistance, BANDS, SEPARATION_MIN } from '../../src/styles/oklch.js';

export { BANDS, SEPARATION_MIN };

/** 中性色讀起來要是灰的，不套彩度下限。 */
export const NEUTRAL_TONES = new Set(['slate']);
export const NEUTRAL_C_MAX = 0.04;
export const TX_SPREAD_MAX = 0.10;
export const BG_SPREAD_MAX = 0.06;

/** 分類槽的上限。八支是本站彩度帶內、門檻 0.05 下等距排列的算術上限：第九支掉到 0.046。 */
export const MAX_CAT_SLOTS = 8;

/*
 * 距離未達門檻而暫時放行的組合。2026-08-19 量到的三組，成因是玫瑰 356°、李 358°、
 * 紅 5° 擠在同一段色相；八支重排的色碼要站主在 PaletteLab 點名之後才動得了
 * （見 CHECKPOINT.palette-convergence.md 第 1 步）。重排落地就把這三行刪掉，
 * 這條規則自動變回硬的。
 *
 * 清單以外的新組合一律直接失敗——已知的三組不會讓第四組跟著混進來。
 */
export const KNOWN_CLOSE_PAIRS = [
  ['rose', 'plum'],
  ['red', 'plum'],
  ['rose', 'red'],
];

const pairKey = (a, b) => [a, b].sort().join('|');
const KNOWN_CLOSE = new Set(KNOWN_CLOSE_PAIRS.map(([a, b]) => pairKey(a, b)));

const round = (n) => +n.toFixed(3);

/**
 * 查一份 tokens.css。
 *
 * @param {object} opts
 * @param {string} opts.tokensPath          tokens.css 的路徑
 * @param {string} [opts.markSourcePath]    分類 mark 已審票的來源（palettes.js）；
 *                                          給了才查 --mark-*
 * @param {boolean} [opts.requireMarks]     該倉的 tokens.css 是否必須有 --mark-*
 * @returns {{errors: string[], notes: string[], summary: string}}
 */
export function checkColorSystem({ tokensPath, markSourcePath, requireMarks = false }) {
  if (!existsSync(tokensPath)) {
    // 讀不到就要出聲。回一份空的判定結果，在呼叫端與「沒有問題」一模一樣。
    throw new Error(`讀不到 ${tokensPath}`);
  }
  const css = readFileSync(tokensPath, 'utf8');
  const errors = [];
  const notes = [];

  const tones = [...css.matchAll(/--tone-([a-z]+)-(tx|bg):\s*(#[0-9a-fA-F]{6})/g)].map((m) => {
    const { L, C, H } = hexToOklch(m[3]);
    return { name: m[1], kind: m[2], hex: m[3], L: round(L), C: round(C), H: round(H) };
  });
  if (!tones.length) errors.push(`${tokensPath} 找不到 --tone-*-tx/bg 這一層原色`);

  const tx = tones.filter((t) => t.kind === 'tx');
  const bg = tones.filter((t) => t.kind === 'bg');

  for (const t of tx) {
    if (t.L < BANDS.txL[0] || t.L > BANDS.txL[1]) {
      errors.push(`--tone-${t.name}-tx ${t.hex}：明度 ${t.L} 出墨色帶 ${BANDS.txL[0]}–${BANDS.txL[1]}`);
    }
    if (NEUTRAL_TONES.has(t.name)) {
      if (t.C > NEUTRAL_C_MAX) {
        errors.push(`--tone-${t.name}-tx ${t.hex}：彩度 ${t.C} 超過中性色上限 ${NEUTRAL_C_MAX}，讀起來不會是灰的`);
      }
    } else if (t.C < BANDS.txC[0] || t.C > BANDS.txC[1]) {
      errors.push(`--tone-${t.name}-tx ${t.hex}：彩度 ${t.C} 出帶 ${BANDS.txC[0]}–${BANDS.txC[1]}（太灰或太豔）`);
    }
  }
  for (const t of bg) {
    if (t.L < BANDS.bgL[0] || t.L > BANDS.bgL[1]) {
      errors.push(`--tone-${t.name}-bg ${t.hex}：明度 ${t.L} 出淡底帶 ${BANDS.bgL[0]}–${BANDS.bgL[1]}`);
    }
    if (t.C > BANDS.bgC[1]) {
      errors.push(`--tone-${t.name}-bg ${t.hex}：彩度 ${t.C} 超過淡底上限 ${BANDS.bgC[1]}，離白不夠近`);
    }
  }

  const spread = (arr) => (arr.length ? round(Math.max(...arr) - Math.min(...arr)) : 0);
  const txSpread = spread(tx.map((t) => t.L));
  const bgSpread = spread(bg.map((t) => t.L));
  if (txSpread > TX_SPREAD_MAX) errors.push(`墨色明度極差 ${txSpread} 超過 ${TX_SPREAD_MAX}，明度不齊`);
  if (bgSpread > BG_SPREAD_MAX) errors.push(`淡底明度極差 ${bgSpread} 超過 ${BG_SPREAD_MAX}`);

  const names = [...new Set(tones.map((t) => t.name))];
  for (const n of names) {
    if (!tx.find((t) => t.name === n)) errors.push(`--tone-${n} 缺 -tx`);
    if (!bg.find((t) => t.name === n)) errors.push(`--tone-${n} 缺 -bg`);
  }

  // 兩支墨色的感知距離。低於門檻，讀者在沒有標籤的圖上會把兩類讀成同一類。
  let closest = null;
  for (let i = 0; i < tx.length; i += 1) {
    for (let j = i + 1; j < tx.length; j += 1) {
      const d = round(oklabDistance(tx[i].hex, tx[j].hex));
      if (!closest || d < closest.d) closest = { a: tx[i].name, b: tx[j].name, d };
      if (d >= SEPARATION_MIN) continue;
      const line = `--tone-${tx[i].name}-tx 與 --tone-${tx[j].name}-tx 距離 ${d}，低於可辨門檻 ${SEPARATION_MIN}`;
      if (KNOWN_CLOSE.has(pairKey(tx[i].name, tx[j].name))) notes.push(`${line}（八支重排未動，待站主點名色碼）`);
      else errors.push(line);
    }
  }

  // 分類槽。第九支排不出門檻內的位置，出現就是有人繞過了帶寬。
  const catSlots = [...new Set([...css.matchAll(/--cat-(\d+)-(?:tx|bg)\s*:/g)].map((m) => Number(m[1])))];
  for (const n of catSlots.filter((n) => n > MAX_CAT_SLOTS)) {
    errors.push(`--cat-${n}：分類槽上限是 ${MAX_CAT_SLOTS}，第 ${n} 支排不進本站彩度帶內的門檻`);
  }

  // --viz-* 是被否決的舊槽名。
  if (/--viz-\d+\s*:/.test(css)) {
    errors.push('tokens.css 出現 --viz-* 舊槽：分類 mark 走 --mark-N（值抄 MARK_TONES），見 docs/DESIGN.md');
  }

  // 分類 mark 的值要逐一存在於已審票裡，不得在 tokens 裡自行出現新 hex。
  const marks = [...css.matchAll(/--mark-(\d+):\s*(#[0-9a-fA-F]{6})/g)];
  if (requireMarks && !marks.length) errors.push('tokens.css 缺 --mark-* 分類 mark 槽');
  if (marks.length && markSourcePath) {
    if (!existsSync(markSourcePath)) throw new Error(`讀不到已審票 ${markSourcePath}`);
    const block = readFileSync(markSourcePath, 'utf8').match(/MARK_TONES\s*=\s*\{([\s\S]*?)\}/)?.[1] ?? '';
    const approved = new Set([...block.matchAll(/#[0-9a-fA-F]{6}/g)].map(([hex]) => hex.toLowerCase()));
    if (!approved.size) throw new Error(`${markSourcePath} 取不到 MARK_TONES 已審票`);
    for (const [, n, hex] of marks) {
      if (!approved.has(hex.toLowerCase())) {
        errors.push(`--mark-${n} ${hex}：不在 MARK_TONES 已審票裡，mark 色不得自行新增`);
      }
    }
  }

  const closestText = closest ? `，最近兩支 ${closest.a}／${closest.b} ${closest.d}` : '';
  const summary = `色彩系統通過：${names.length} 對色票，墨色明度極差 ${txSpread}（≤${TX_SPREAD_MAX}），淡底 ${bgSpread}（≤${BG_SPREAD_MAX}）${closestText}。`;
  return { errors, notes, summary };
}

/** 各倉的閘照這支跑：印出結果，不通過就 exit 1。 */
export function runColorSystem(opts) {
  const { errors, notes, summary } = checkColorSystem(opts);
  for (const n of notes) console.log(`  已登記待處理：${n}`);
  if (errors.length) {
    console.error(`色彩系統不通過（${errors.length}）：\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }
  console.log(summary);
}

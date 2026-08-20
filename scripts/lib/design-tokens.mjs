/*
 * 裸 hex 的檢查——站群唯一一份（2026-08-20 之前五個倉各一份副本）。
 *
 * 已收編的檔案不得出現裸 hex：顏色寫進 tokens.css，或寫進一個開頭帶 `token-exempt`
 * 註記的頁面色票物件（豁免到下一個以 `};` 結尾的行為止）。尚未收編的檔案列在各倉的
 * scripts/design-token-exceptions.txt，那份清單只准變短。
 *
 * `token-exempt` 的登記在 phenom-ops 的 infra/token-exempt.json，由該倉的
 * check-token-exempt.mjs 逐檔比對；那支檢查用的就是本檔的 exemptRegions()，
 * 豁免範圍的判定只有這一份。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/**
 * 一份原始碼裡的 token-exempt 區段。豁免自帶標記那一行開始，到下一個以 `};` 或 `}`
 * 結尾的行為止。回傳被豁免的行號（1 起算）、標記的個數，以及豁免區裡的 hex 條數
 * ——後兩個數字是 phenom-ops 的登記表在比對的東西：登記過的檔案裡再長出新的裸 hex，
 * 各倉的閘看不到（它整段跳過），只有數字對不上才顯得出來。
 *
 * @param {string} source
 * @returns {{exemptLines: Set<number>, markers: number, hexes: number}}
 */
export function exemptRegions(source) {
  const exemptLines = new Set();
  let markers = 0;
  let hexes = 0;
  let exempt = false;
  source.split('\n').forEach((line, i) => {
    if (line.includes('token-exempt')) {
      exempt = true;
      markers += 1;
    }
    const wasExempt = exempt;
    if (exempt && /};?\s*$/.test(line.trim()) && !line.includes('token-exempt')) exempt = false;
    if (!wasExempt) return;
    exemptLines.add(i + 1);
    hexes += (line.match(HEX) ?? []).length;
  });
  return { exemptLines, markers, hexes };
}

/**
 * @param {object} opts
 * @param {string} [opts.root]            掃描根目錄，預設 src
 * @param {string} [opts.exceptionsPath]  未收編清單
 * @param {boolean} [opts.requireExceptionsFile] 清單檔不存在時要不要出錯
 * @returns {{violations: string[], stale: string[], checked: number, exceptions: string[]}}
 */
export function checkDesignTokens({
  root = 'src',
  exceptionsPath = join('scripts', 'design-token-exceptions.txt'),
  requireExceptionsFile = false,
} = {}) {
  if (requireExceptionsFile && !existsSync(exceptionsPath)) {
    throw new Error(`讀不到未收編清單 ${exceptionsPath}`);
  }
  const exceptions = (existsSync(exceptionsPath) ? readFileSync(exceptionsPath, 'utf8') : '')
    .split('\n')
    .map((line) => line.split('#')[0].trim())
    .filter(Boolean);

  const stale = exceptions.filter((path) => !existsSync(path));

  const files = walk(root).filter(
    (path) =>
      /\.(jsx|tsx|js|css)$/.test(path) &&
      path !== join(root, 'styles', 'tokens.css') &&
      !exceptions.includes(path),
  );

  const violations = [];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const lines = source.split('\n');
    const { exemptLines } = exemptRegions(source);
    lines.forEach((line, i) => {
      if (exemptLines.has(i + 1)) return;
      const hits = line.match(HEX);
      if (hits) violations.push(`${file}:${i + 1} ${hits.join(' ')}`);
    });
  }
  return { violations, stale, checked: files.length, exceptions };
}

/** 各倉的閘照這支跑。 */
export function runDesignTokens(opts) {
  const { violations, stale, checked, exceptions } = checkDesignTokens(opts);
  if (stale.length) {
    throw new Error(`design-token-exceptions.txt 列了已經不存在的檔：${stale.join('、')}——把過期的條目刪掉。`);
  }
  if (violations.length) {
    throw new Error(
      '已收編的檔案出現裸 hex（改用 tokens.css 的變數，或放進帶 token-exempt 註記的色票物件）：\n' +
        violations.map((v) => `  ${v}`).join('\n'),
    );
  }
  console.log(`色票檢查通過：${checked} 個已收編的檔案乾淨，未收編 ${exceptions.length} 個。`);
}

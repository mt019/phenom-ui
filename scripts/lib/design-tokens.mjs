/*
 * 裸 hex 的檢查——站群唯一一份（2026-08-20 之前五個倉各一份副本）。
 *
 * 已收編的檔案不得出現裸 hex：顏色寫進 tokens.css，或寫進一個開頭帶 `token-exempt`
 * 註記的頁面色票物件（豁免到下一個以 `};` 結尾的行為止）。尚未收編的檔案列在各倉的
 * scripts/design-token-exceptions.txt，那份清單只准變短。
 *
 * 已知的窟窿：`token-exempt` 是一行註記，沒有登記、沒有期限、沒有清單，
 * 目前八個頁面前綴共 241 條 inline 色票靠它豁免（見 CHECKPOINT.palette-convergence.md
 * 第 5 步：改成登記制，登記表進 phenom-ops/infra/）。
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
    const lines = readFileSync(file, 'utf8').split('\n');
    let exempt = false;
    lines.forEach((line, i) => {
      if (line.includes('token-exempt')) exempt = true;
      const wasExempt = exempt;
      if (exempt && /};?\s*$/.test(line.trim()) && !line.includes('token-exempt')) exempt = false;
      if (wasExempt) return;
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

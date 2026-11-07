// Vue 版前端原始碼不得帶 React 生態的依賴——站群唯一一份，掃 src/ 底下的 .vue、.js、.ts。
//
// 2026-11-07 自 phenom-guzhun 的 validate-vue-sources.mjs 搬來。原本三條，顏色字面值回歸
// design-tokens.mjs（副檔名已加 .vue），數學字元回歸 math-notation.mjs（不分副檔名），
// 這裡只剩 React 依賴這一條。
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const REACT_IMPORT =
  /from\s+['"](?:react|react-dom|react-router(?:-dom)?|lucide-react|@phenomcanvas\/ui)(?:\/[^'"]*)?['"]/;

const walk = (dir, skip) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const path = join(dir, e.name);
  if (e.isDirectory()) return skip.includes(path) ? [] : walk(path, skip);
  return /\.(?:vue|js|ts)$/.test(e.name) ? [path] : [];
});

/**
 * @param {object} [opts]
 * @param {string}   [opts.root]     掃描根，預設 src
 * @param {string[]} [opts.skipDirs] 不掃的目錄，預設 src/data（同步進來的資料層）
 */
export function checkVueSources({ root = 'src', skipDirs = [join(root, 'data')] } = {}) {
  const files = walk(root, skipDirs);
  const vueFiles = files.filter((f) => f.endsWith('.vue')).length;
  const failures = [];
  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (REACT_IMPORT.test(line.replace(/\/\/.*$/, ''))) {
        failures.push(`${relative('.', file)}:${i + 1} React 依賴：${line.trim().slice(0, 100)}`);
      }
    });
  }
  return { failures, checked: files.length, vueFiles };
}

/** 各倉的閘照這支跑。 */
export function runVueSources(opts) {
  const { failures, checked, vueFiles } = checkVueSources(opts);
  if (vueFiles === 0) {
    console.error(`Vue 原始碼檢查一個 .vue 都沒讀到（掃描根 ${opts?.root ?? 'src'}），檢查沒有實際執行。`);
    process.exit(1);
  }
  if (failures.length) {
    console.error(`validate:vue — ${failures.length} 處帶 React 依賴：\n${failures.map((l) => `- ${l}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`validate:vue — 掃了 ${checked} 個檔（.vue ${vueFiles} 個），沒有 React 依賴`);
}

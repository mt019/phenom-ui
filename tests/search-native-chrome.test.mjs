import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

/*
 * type="search" 在 WebKit 與 Blink 會自動畫原生清除叉；元件自己再畫一個，輸入框右側就並排兩個
 * （2026-11-10 renwen 搜尋頁）。這裡兩件事：共用 base 樣式隱藏四種原生裝飾；元件原始碼中
 * 出現 type="search" 的檔案，樣式入口必須含這些規則（styles.css 與 styles-external-fonts.css
 * 兩個入口都 @import styles-base.css）。
 */
const root = new URL('../', import.meta.url).pathname;
const PSEUDOS = [
  'search-cancel-button',
  'search-decoration',
  'search-results-button',
  'search-results-decoration',
];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(vue|jsx|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

test('base 樣式隱藏 type="search" 的四種原生裝飾', async () => {
  const css = await readFile(join(root, 'src/styles-base.css'), 'utf8');
  for (const name of PSEUDOS) {
    const m = css.match(new RegExp(`input\\[type=['"]search['"]\\]::-webkit-${name}`));
    assert.ok(m, `缺 ::-webkit-${name}`);
  }
  const block = css.match(/input\[type='search'\]::-webkit-search-cancel-button[^{]*\{([^}]*)\}/);
  assert.match(block[1], /display:\s*none/);
  assert.match(block[1], /appearance:\s*none/);
});

test('兩個樣式入口都帶 styles-base.css', async () => {
  for (const f of ['src/styles.css', 'src/styles-external-fonts.css']) {
    assert.match(await readFile(join(root, f), 'utf8'), /@import '\.\/styles-base\.css'/);
  }
});

test('元件裡的 type="search" 被掃到（防止掃描範圍壞掉而空過）', async () => {
  const files = [...(await walk(join(root, 'src'))), ...(await walk(join(root, 'packages/vue/src')))];
  const hits = [];
  for (const f of files) {
    if (/type=["']search["']/.test(await readFile(f, 'utf8'))) hits.push(f);
  }
  assert.ok(hits.length >= 4, `只找到 ${hits.length} 處 type="search"`);
});

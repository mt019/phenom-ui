import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/*
 * 引註編號的驗收：號碼按來源在正文的出現順序給，同一條來源在一篇裡永遠是同一個號。
 * 章末 SourcesList 掃 DOM 的 span[data-cite] 按 DOM 順序編號，兩邊因此對得起來——
 * 這份測試釘住的就是那個順序，改動編號規則時它會先報。
 *
 * 元件是 JSX，node --test 不吃，所以用倉裡已有的 esbuild 就地轉一次再 import。
 */
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/*
 * 用倉裡已有的 esbuild 把元件打包成一支 esm 檔再 import。輸出寫進 node_modules 底下，
 * 不寫成 data: URL——data: 模組解析不了 react 這種裸名稱的 import。
 */
async function loadComponents() {
  const outfile = join(root, 'node_modules', '.phenom-test', 'cite.mjs');
  await build({
    entryPoints: [join(here, 'fixtures/cite-entry.jsx')],
    outfile,
    bundle: true,
    format: 'esm',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react', 'react-router-dom'],
    // KaTeX 的樣式表在瀏覽器由建置工具處理，node 這裡吃不了 .css，打包時當空檔。
    loader: { '.css': 'empty' },
    logLevel: 'silent',
  });
  return import(pathToFileURL(outfile).href);
}

const { CiteNumbering, HoverCite } = await loadComponents();


const source = (id) => ({ author: `作者${id}`, title: `書${id}`, year: 2026, locator: '頁 1' });

function article(children) {
  return renderToStaticMarkup(createElement(CiteNumbering, { resetKey: 'zh' }, children));
}

test('號碼按出現順序給，同一條來源同一個號', () => {
  const html = article([
    createElement(HoverCite, { key: 'a', source: source('a'), sourceId: 'a' }, '第一句'),
    createElement(HoverCite, { key: 'b', source: source('b'), sourceId: 'b' }, '第二句'),
    createElement(HoverCite, { key: 'a2', source: source('a'), sourceId: 'a' }, '再引一次'),
  ]);
  const numbers = [...html.matchAll(/class="fn-ref"[^>]*>(\d+)</g)].map((m) => m[1]);
  assert.deepEqual(numbers, ['1', '2', '1']);
});

test('每個引註留下 data-cite，章末清單靠它生號與錨點', () => {
  const html = article(createElement(HoverCite, { source: source('a'), sourceId: 'a' }, '一句話'));
  assert.match(html, /data-cite="a"/);
});

test('點線不是預設，要傳 mark 才畫', () => {
  const plain = article(createElement(HoverCite, { source: source('a'), sourceId: 'a' }, '一句話'));
  assert.ok(!plain.includes('cite-mark'));
  const marked = article(createElement(HoverCite, { source: source('a'), sourceId: 'a', mark: true }, '一句話'));
  assert.match(marked, /cite-mark/);
});

test('沒有來源條目就照原樣輸出，不佔號碼', () => {
  const html = article([
    createElement(HoverCite, { key: 'x', source: undefined, sourceId: 'x' }, '沒有出處的字'),
    createElement(HoverCite, { key: 'b', source: source('b'), sourceId: 'b' }, '有出處的字'),
  ]);
  assert.match(html, /沒有出處的字/);
  const numbers = [...html.matchAll(/class="fn-ref"[^>]*>(\d+)</g)].map((m) => m[1]);
  assert.deepEqual(numbers, ['1']);
});

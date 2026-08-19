import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/*
 * 圖號的驗收。號碼來自資料層 figures.json 的順序（建置端寫成 number 欄），不是渲染順序——
 * 正文的「見圖 4」會出現在那張圖之前，按渲染順序指派會把號碼給先講到它的那一句。這份測試
 * 釘住的就是這件事：把清單順序與渲染順序寫成相反的，號碼仍要跟著清單。
 */
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

async function loadComponents() {
  const outfile = join(root, 'node_modules', '.phenom-test', 'figure.mjs');
  await build({
    entryPoints: [join(here, 'fixtures/figure-entry.jsx')],
    outfile,
    bundle: true,
    format: 'esm',
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react', 'react-router-dom'],
    loader: { '.css': 'empty' },
    logLevel: 'silent',
  });
  return import(pathToFileURL(outfile).href);
}

const { FigureNumbering, FigureBlock, FigRef } = await loadComponents();

const figures = {
  beta: { id: 'beta', number: 2, title: '第二張', en: { title: 'The second' } },
  alpha: { id: 'alpha', number: 1, title: '第一張', en: { title: 'The first' } },
};

const page = (children, lang = 'zh') =>
  renderToStaticMarkup(createElement(FigureNumbering, { figures, lang }, children));

test('號碼照資料層的 number，不照渲染順序', () => {
  const html = page([
    createElement(FigureBlock, { key: 'b', id: 'beta' }, '圖形'),
    createElement(FigureBlock, { key: 'a', id: 'alpha' }, '圖形'),
  ]);
  const numbers = [...html.matchAll(/class="fig-num">(\d+)</g)].map((m) => m[1]);
  assert.deepEqual(numbers, ['2', '1']);
});

test('圖說印出題目，錨點用 fig-<id>', () => {
  const html = page(createElement(FigureBlock, { id: 'alpha', caption: '說明一句' }, '圖形'));
  assert.match(html, /id="fig-alpha"/);
  assert.match(html, /第一張/);
  assert.match(html, /說明一句/);
});

test('英文版用 Figure 與英文題目', () => {
  const html = page(createElement(FigureBlock, { id: 'alpha' }, '圖形'), 'en');
  assert.match(html, /Figure/);
  assert.match(html, /The first/);
});

test('正文的指涉連到那張圖，號碼與圖說同一個', () => {
  const html = page([
    createElement(FigRef, { key: 'r', id: 'beta' }),
    createElement(FigureBlock, { key: 'b', id: 'beta' }, '圖形'),
  ]);
  assert.match(html, /href="#fig-beta"/);
  const numbers = [...html.matchAll(/class="fig-num">(\d+)</g)].map((m) => m[1]);
  assert.deepEqual(numbers, ['2', '2']);
});

test('清單上沒有的圖不印號，圖照樣渲染', () => {
  const html = page(createElement(FigureBlock, { id: 'gamma', caption: '沒有登記的圖' }, '圖形'));
  assert.ok(!html.includes('fig-num'));
  assert.match(html, /沒有登記的圖/);
});

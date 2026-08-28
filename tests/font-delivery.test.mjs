import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkFontDelivery } from '../scripts/lib/font-delivery.mjs';

/*
 * 這道檢查要抓的是手記 2026-08-28 那件事：一份 1.75 MB 的字型躺在產物裡、由 index.html
 * 的 preload 拉下來，而沒有任何 @font-face 引用它，站上原本三條字型檢查全過。
 * 正向與負向都要驗——只驗正向的話，判定寫壞（例如 CSS 讀成空字串）會讓每個站都通過。
 */
const makeDist = ({ css, html, fonts }) => {
  const dist = mkdtempSync(join(tmpdir(), 'font-delivery-'));
  mkdirSync(join(dist, 'assets'));
  writeFileSync(join(dist, 'assets', 'index.css'), css);
  writeFileSync(join(dist, 'index.html'), html);
  for (const name of fonts) writeFileSync(join(dist, 'assets', name), 'not really a font');
  return dist;
};

const FACE = (file) => `@font-face{font-family:X;src:url(/assets/${file}) format("woff2")}`;

test('引用齊全就通過', () => {
  const dist = makeDist({
    css: FACE('Body-abc123.woff2'),
    html: '<html><head><link rel="preload" href="/assets/Body-abc123.woff2" as="font"></head></html>',
    fonts: ['Body-abc123.woff2'],
  });
  const result = checkFontDelivery({ dist });
  assert.deepEqual(result.failures, []);
  assert.equal(result.fonts, 1);
});

test('沒有人引用的字型檔要報', () => {
  const dist = makeDist({
    css: FACE('Body-abc123.woff2'),
    html: '<html><head></head></html>',
    fonts: ['Body-abc123.woff2', 'Orphan-def456.woff2'],
  });
  const { failures } = checkFontDelivery({ dist });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /Orphan-def456\.woff2/);
});

test('preload 指向沒有人引用的檔要報', () => {
  const dist = makeDist({
    css: FACE('Body-abc123.woff2'),
    html: '<html><head><link rel="preload" href="/fonts/Gone.woff2" as="font" type="font/woff2" crossorigin></head></html>',
    fonts: ['Body-abc123.woff2'],
  });
  const { failures } = checkFontDelivery({ dist });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /Gone\.woff2/);
});

test('一份 CSS 或一份 HTML 都沒看到就要報，不能當成通過', () => {
  const dist = mkdtempSync(join(tmpdir(), 'font-delivery-empty-'));
  const { failures } = checkFontDelivery({ dist });
  assert.equal(failures.length, 2);
  assert.ok(failures.every((line) => /什麼都沒看到/.test(line)));
});

test('字型的 preload 才驗，別的 preload 不管', () => {
  const dist = makeDist({
    css: FACE('Body-abc123.woff2'),
    html: '<html><head><link rel="preload" href="/assets/hero.webp" as="image"></head></html>',
    fonts: ['Body-abc123.woff2'],
  });
  assert.deepEqual(checkFontDelivery({ dist }).failures, []);
});

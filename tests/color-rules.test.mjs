/*
 * 負向測試：每一條規則各餵一句已知該被報的內容，另餵一份乾淨的確認不誤報。
 * 只驗「有沒有印出提醒」等於只驗了訊息存在，所以這裡逐條比對訊息內容。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkColorSystem, KNOWN_CLOSE_PAIRS } from '../scripts/lib/color-system.mjs';
import { checkDesignTokens } from '../scripts/lib/design-tokens.mjs';

const CLEAN_TONES = `:root {
  --tone-rose-tx:  #8f6071;  --tone-rose-bg:  #f7edf0;
  --tone-amber-tx: #8a6d3b;  --tone-amber-bg: #f2e8d9;
  --tone-green-tx: #566d50;  --tone-green-bg: #e8efe5;
  --tone-slate-tx: #52616a;  --tone-slate-bg: #eef1f2;
}`;

function withTokens(css, opts = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'color-rules-'));
  const tokensPath = join(dir, 'tokens.css');
  writeFileSync(tokensPath, css);
  try {
    return checkColorSystem({ tokensPath, ...opts });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('乾淨的四對色票不報任何錯', () => {
  const { errors, notes } = withTokens(CLEAN_TONES);
  assert.deepEqual(errors, []);
  assert.deepEqual(notes, []);
});

test('墨色出明度帶', () => {
  const { errors } = withTokens(CLEAN_TONES.replace('#8a6d3b', '#c9b89a'));
  assert.ok(errors.some((e) => e.includes('明度') && e.includes('出墨色帶')), errors.join('\n'));
});

test('淡底離白不夠近', () => {
  const { errors } = withTokens(CLEAN_TONES.replace('#e8efe5', '#b8d0b0'));
  assert.ok(errors.some((e) => e.includes('--tone-green-bg')), errors.join('\n'));
});

test('中性色帶了彩度', () => {
  const { errors } = withTokens(CLEAN_TONES.replace('--tone-slate-tx: #52616a', '--tone-slate-tx: #4c7971'));
  assert.ok(errors.some((e) => e.includes('中性色上限')), errors.join('\n'));
});

test('缺 -bg 的色票', () => {
  const { errors } = withTokens(CLEAN_TONES.replace('  --tone-rose-bg:  #f7edf0;', ''));
  assert.ok(errors.some((e) => e === '--tone-rose 缺 -bg'), errors.join('\n'));
});

test('沒登記過的兩支太近就是錯', () => {
  // 茶青 #4c7971 與另一支同色相的墨色，距離遠低於 0.05。
  const css = CLEAN_TONES.replace(
    '}',
    '  --tone-teal-tx:  #4c7971;  --tone-teal-bg:  #e3edeb;\n  --tone-jade-tx:  #4e7b73;  --tone-jade-bg:  #e3edea;\n}',
  );
  const { errors } = withTokens(css);
  assert.ok(errors.some((e) => e.includes('低於可辨門檻')), errors.join('\n'));
});

test('登記過的組合只列為待處理，不擋建置', () => {
  // 現行八支已經全部過門檻，KNOWN_CLOSE_PAIRS 是空的；這裡臨時登記一組，
  // 驗放行的機制還在，跑完拿掉。玫瑰 #8f6071 與 #945d70 距離 0.011。
  const css = CLEAN_TONES.replace('}', '  --tone-plum-tx:  #945d70;  --tone-plum-bg:  #f2e3e7;\n}');
  assert.deepEqual(KNOWN_CLOSE_PAIRS, [], '清單該是空的，有東西就先去看它為什麼還在');
  const blocked = withTokens(css);
  assert.ok(blocked.errors.some((e) => e.includes('低於可辨門檻')), blocked.errors.join('\n'));

  KNOWN_CLOSE_PAIRS.push(['rose', 'plum']);
  try {
    const { errors, notes } = withTokens(css);
    assert.deepEqual(errors, []);
    assert.ok(notes.some((n) => n.includes('rose') && n.includes('plum')), notes.join('\n'));
  } finally {
    KNOWN_CLOSE_PAIRS.length = 0;
  }
});

test('分類槽第九支', () => {
  const css = CLEAN_TONES.replace('}', '  --cat-9-tx: var(--tone-rose-tx);  --cat-9-bg: var(--tone-rose-bg);\n}');
  const { errors } = withTokens(css);
  assert.ok(errors.some((e) => e.includes('--cat-9')), errors.join('\n'));
  const ok = withTokens(CLEAN_TONES.replace('}', '  --cat-8-tx: var(--tone-rose-tx);\n}'));
  assert.deepEqual(ok.errors, []);
});

test('被否決的 --viz-* 舊槽', () => {
  const { errors } = withTokens(CLEAN_TONES.replace('}', '  --viz-1: #8f6071;\n}'));
  assert.ok(errors.some((e) => e.includes('--viz-*')), errors.join('\n'));
});

test('mark 色不在已審票裡', () => {
  const dir = mkdtempSync(join(tmpdir(), 'color-rules-'));
  const tokensPath = join(dir, 'tokens.css');
  const markPath = join(dir, 'palettes.js');
  writeFileSync(markPath, "export const MARK_TONES = {\n  rose: '#e8a4ac',\n};\n");
  writeFileSync(tokensPath, `${CLEAN_TONES}\n:root { --mark-1: #e8a4ac; --mark-2: #123456; }`);
  const { errors } = checkColorSystem({ tokensPath, markSourcePath: markPath });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('--mark-2'), errors[0]);
});

test('讀不到檔案要拋錯，不可以回空結果', () => {
  assert.throws(() => checkColorSystem({ tokensPath: join(tmpdir(), 'no-such-tokens.css') }), /讀不到/);
});

function withSrc(files, exceptions = null) {
  const dir = mkdtempSync(join(tmpdir(), 'design-tokens-'));
  mkdirSync(join(dir, 'src'), { recursive: true });
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, 'src', name), body);
  if (exceptions !== null) writeFileSync(join(dir, 'scripts', 'design-token-exceptions.txt'), exceptions);
  try {
    return checkDesignTokens({
      root: join(dir, 'src'),
      exceptionsPath: join(dir, 'scripts', 'design-token-exceptions.txt'),
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('裸 hex 被報，帶 token-exempt 的色票物件放行', () => {
  const bad = withSrc({ 'Page.jsx': "const a = '#ff0000';\n" });
  assert.equal(bad.violations.length, 1);
  const ok = withSrc({
    'Page.jsx': "const PALETTE = { // token-exempt\n  a: '#ff0000',\n};\nconst x = 1;\n",
  });
  assert.deepEqual(ok.violations, []);
});

test('豁免區結束之後又出現的裸 hex 照報', () => {
  const r = withSrc({
    'Page.jsx': "const PALETTE = { // token-exempt\n  a: '#ff0000',\n};\nconst b = '#00ff00';\n",
  });
  assert.equal(r.violations.length, 1);
  assert.ok(r.violations[0].includes('#00ff00'), r.violations[0]);
});

test('未收編清單列了不存在的檔', () => {
  const r = withSrc({ 'Page.jsx': 'const a = 1;\n' }, 'src/NoSuchPage.jsx\n');
  assert.deepEqual(r.stale, ['src/NoSuchPage.jsx']);
});

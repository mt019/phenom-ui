import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLegacyFontUrl } from '../packages/vue/scripts/legacy-font-url.mjs';

const same = 'a'.repeat(64);
const other = 'b'.repeat(64);
const external = { sha256: same, url: `https://assets.phenomcanvas.com/v1/${same}/fonts/X.woff2` };

test('sha 相同：用外部檔網址，不發 HEAD', async () => {
  let called = 0;
  const r = await resolveLegacyFontUrl({
    name: 'X.woff2', legacySha: same, legacyBytes: 10, external,
    head: async () => { called += 1; return { status: 200, length: 10 }; },
  });
  assert.equal(r.source, 'external');
  assert.equal(r.url, external.url);
  assert.equal(called, 0);
});

test('sha 不同且舊網址回 200、長度相符：改指相容主題自己的 sha 網址', async () => {
  const seen = [];
  const r = await resolveLegacyFontUrl({
    name: 'X.woff2', legacySha: other, legacyBytes: 10, external,
    head: async (url) => { seen.push(url); return { status: 200, length: 10 }; },
  });
  const expected = `https://assets.phenomcanvas.com/v1/${other}/fonts/X.woff2`;
  assert.equal(r.source, 'legacy-sha');
  assert.equal(r.url, expected);
  assert.deepEqual(seen, [expected]);
});

test('sha 不同而舊網址不是 200：中止', async () => {
  await assert.rejects(
    resolveLegacyFontUrl({ name: 'X.woff2', legacySha: other, legacyBytes: 10, external, head: async () => ({ status: 404, length: -1 }) }),
    /HEAD 回 404/,
  );
});

test('sha 不同而舊網址長度不符：中止', async () => {
  await assert.rejects(
    resolveLegacyFontUrl({ name: 'X.woff2', legacySha: other, legacyBytes: 10, external, head: async () => ({ status: 200, length: 9 }) }),
    /content-length 9/,
  );
});

test('外部檔沒有同名：中止', async () => {
  await assert.rejects(resolveLegacyFontUrl({ name: 'X.woff2', legacySha: same, external: undefined }), /沒有同名的外部檔/);
});

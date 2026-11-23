// 標題字型覆蓋檢查（scripts/check-display-coverage.mjs）的判準。判斷讀的是 fonts/ 底下真的
// RadioNewsman-subset.woff2 的 cmap，不是寫死的覆蓋表；補字版退回未補字的檔，第一個測試就失敗。
import assert from 'node:assert/strict';
import test from 'node:test';
import { checkCoverage, needsDisplayGlyph } from '../scripts/check-display-coverage.mjs';

const t = (text) => ({ kind: '測試', text });

test('補字版畫得出人文來風實際出現的拉丁字元與標點', () => {
  const { missing, latinTexts } = checkCoverage([
    t('我的博士導師、歐洲道家─Günter Wohlfart'),
    t('獨特性的秘密：吾師Jean-François Marquet'),
    t('煎餅（Bánh Xèo）'),
    t('Hegel’s “Logik” – 1812—1816…'),
    t('Œuvres · Straße · Łódź · Dvořák · Ōno · ŋ'),
  ]);
  assert.equal(latinTexts, 5);
  assert.deepEqual([...missing.keys()], []);
});

test('負向：補字範圍外的拼音聲調、越南文要報缺，並帶樣本', () => {
  const { missing } = checkCoverage([t('Zhǎng Ǒ'), t('Ếxample'), t('Kant')]);
  assert.deepEqual([...missing.keys()].sort((a, b) => a - b), [0x01ce, 0x01d1, 0x1ebe]);
  assert.match(missing.get(0x01ce)[0], /Zhǎng/);
});

test('只檢查拉丁字母與拉丁標點；漢字、間隔號、羅馬數字由明體畫', () => {
  assert.equal(needsDisplayGlyph('ü'), true);
  assert.equal(needsDisplayGlyph('’'), true);
  assert.equal(needsDisplayGlyph('康'), false);
  assert.equal(needsDisplayGlyph('·'), false);
  assert.equal(needsDisplayGlyph('Ⅳ'), false);
  const { latinTexts, missing } = checkCoverage([t('凱薩琳·赫本'), t('第Ⅳ卷')]);
  assert.equal(latinTexts, 0);
  assert.equal(missing.size, 0);
});

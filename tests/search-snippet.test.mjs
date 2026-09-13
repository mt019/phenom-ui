import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeHtml, snippetHtml } from '../src/search/snippet.js';

test('escapeHtml 跳脫 & < > 與雙引號', () => {
  assert.equal(escapeHtml('<a & "b">'), '&lt;a &amp; &quot;b&quot;&gt;');
});

test('多詞命中各自標記，長詞優先且不重疊', () => {
  const html = snippetHtml('中華民國憲法法庭審理案件', { terms: ['憲法', '憲法法庭'], width: 50 });
  assert.equal(html, '中華民國<mark>憲法法庭</mark>審理案件');
  // 「憲法」不該在「憲法法庭」裡面又被框一次
  assert.equal((html.match(/<mark>/g) ?? []).length, 1);
});

test('命中重疊不二次標記：短詞完全落在長詞內就跳過', () => {
  const html = snippetHtml('借名登記契約成立', { terms: ['登記', '借名登記'], width: 30 });
  assert.equal(html, '<mark>借名登記</mark>契約成立');
});

test('用 at/length/context 逐一命中出一段前後文（KWIC）', () => {
  const html = snippetHtml('前情提要出名人與借名人之間成立借名登記契約後續發展', {
    at: 15, length: 4, terms: ['借名登記'], context: 5,
  });
  assert.equal(html, '…人之間成立<mark>借名登記</mark>契約後續發…');
});

test('沒有命中就從頭截，超出視窗才補省略號', () => {
  const html = snippetHtml('沒有命中詞的一段文字用來測試從頭截斷的行為與省略號', { terms: [], width: 10 });
  assert.equal(html, '沒有命中詞的一段文字…');
});

test('視窗前後都被截斷時，頭尾各補一個省略號', () => {
  const html = snippetHtml('這是一段很長的文字，中間藏著關鍵字，後面還有很多內容要被截掉才對', {
    terms: ['關鍵字'], width: 10,
  });
  assert.ok(html.startsWith('…'));
  assert.ok(html.endsWith('…'));
  assert.ok(html.includes('<mark>關鍵字</mark>'));
});

test('詞本身含 HTML 特殊字元，比對用原文、輸出仍跳脫', () => {
  const html = snippetHtml('條文寫 <甲> 應繳稅款', { terms: ['<甲>'], width: 20 });
  assert.equal(html, '條文寫 <mark>&lt;甲&gt;</mark> 應繳稅款');
});

test('未命中的字元原樣跳脫，不會被誤標', () => {
  const html = snippetHtml('A & B 都不是命中詞', { terms: ['命中詞'], width: 20 });
  assert.equal(html, '… B 都不是<mark>命中詞</mark>');
});

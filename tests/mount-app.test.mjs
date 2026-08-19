import assert from 'node:assert/strict';
import test from 'node:test';

import { hasPrerenderedMarkup } from '../src/mountApp.js';

/*
 * 這個判斷決定開發時是水合還是重畫。寫錯的兩種後果各自安靜：判成有內容而其實沒有，
 * 每次載入都報一次水合不一致；判成沒有而其實有，產物那邊會把預先渲染的 HTML 丟掉重畫，
 * 讀者看得到閃動、搜尋引擎拿到的還是對的，兩種都不會讓建置變紅。
 */
test('空的掛載節點不算預先渲染過', () => {
  assert.equal(hasPrerenderedMarkup({ firstElementChild: null }), false);
  assert.equal(hasPrerenderedMarkup(null), false);
  assert.equal(hasPrerenderedMarkup(undefined), false);
});

test('只有空白文字節點的掛載節點也不算', () => {
  // firstChild 是文字節點時 firstElementChild 仍為 null，判斷取的是後者。
  assert.equal(hasPrerenderedMarkup({ firstChild: { nodeType: 3 }, firstElementChild: null }), false);
});

test('有元素子節點就是預先渲染過的產物', () => {
  assert.equal(hasPrerenderedMarkup({ firstElementChild: { tagName: 'DIV' } }), true);
});

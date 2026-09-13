// 檢索結果摘要：從原文取一個視窗、跳脫 HTML、插 <mark>。純 ESM，不依賴 React 或 DOM，
// 可以直接進 Cloudflare Pages Function（phenom-tax 的 functions/api/search.ts）與瀏覽器端
// 兩邊用同一份判定。原本各站各寫一份：phenom-tax 的 makeSnippet 用控制字元避免二次標記，
// phenom-zhujiahua 的 kwic + snippetHtml 逐一命中各出一段前後文；本檔把兩者的判定併成一支。

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"]/g, (ch) => HTML_ESCAPES[ch]);
}

// 在未跳脫的原文上找出所有命中的區段：詞長由長到短依序找，短詞若與已經佔住的區段
// 重疊就跳過——「憲法法庭」先佔住，「憲法」就不會在它裡面再框一次。找完按位置排序，
// 插標記那一步只需要按位置順序走一遍。
function findSpans(text, terms) {
  const ordered = [...new Set(terms.filter(Boolean))].sort((a, b) => b.length - a.length);
  const spans = [];
  for (const term of ordered) {
    let from = 0;
    for (;;) {
      const start = text.indexOf(term, from);
      if (start === -1) break;
      const end = start + term.length;
      from = start + 1;
      if (spans.some((span) => start < span.end && end > span.start)) continue;
      spans.push({ start, end });
    }
  }
  spans.sort((a, b) => a.start - b.start);
  return spans;
}

// 逐段跳脫、只在命中的區段外面包 <mark>；跳脫在這裡才做，所以詞本身含 & < > 這種
// 字元也比對得到原文，不必事先猜它跳脫後長什麼樣。
function markPlain(text, terms) {
  const spans = findSpans(text, terms);
  let out = '';
  let cursor = 0;
  for (const { start, end } of spans) {
    out += escapeHtml(text.slice(cursor, start));
    out += `<mark>${escapeHtml(text.slice(start, end))}</mark>`;
    cursor = end;
  }
  out += escapeHtml(text.slice(cursor));
  return out;
}

/*
 * 從 `text` 取一個視窗，跳脫後插標記，回傳可以直接塞進 HTML 的字串。
 *
 * 視窗怎麼定，兩種給法擇一：
 * - 給 `at`（配 `length`、`context`）：以這個命中位置為錨，視窗往前後各留 `context` 字。
 *   一筆結果有多處命中、要逐處各出一段前後文時用這個（phenom-zhujiahua 的 KWIC）。
 * - 不給 `at`：取 `terms` 裡最早出現的位置當錨，視窗寬度固定 `width`，錨往前只留
 *   `width / 3`、其餘留給後文；沒有任何命中就從頭截。一筆結果只出一段摘要、視窗內把
 *   所有命中一次標完時用這個（phenom-tax 的 Pages Function）。
 *
 * `terms` 是視窗裡要標記的全部詞，不限於決定錨點的那一個——tax 把查詢原文與分詞結果
 * 一起傳進來，視窗裡凡是含這些詞的地方全部標記；長詞優先、不重疊、不二次標記。
 */
export function snippetHtml(text, {
  at = null,
  length = 0,
  terms = [],
  width = 140,
  context = null,
  ellipsis = '…',
} = {}) {
  const source = String(text ?? '');
  let anchor = at;
  if (anchor === null || anchor === undefined) {
    anchor = -1;
    for (const term of terms) {
      if (!term) continue;
      const found = source.indexOf(term);
      if (found > -1 && (anchor === -1 || found < anchor)) anchor = found;
    }
  }

  let start;
  let end;
  if (context !== null && at !== null && at !== undefined) {
    start = Math.max(0, at - context);
    end = Math.min(source.length, at + length + context);
  } else {
    start = anchor === -1 ? 0 : Math.max(0, anchor - Math.floor(width / 3));
    end = Math.min(source.length, start + width);
  }

  const slice = source.slice(start, end);
  const marked = markPlain(slice, terms);
  const before = start > 0 ? ellipsis : '';
  const after = end < source.length ? ellipsis : '';
  return `${before}${marked}${after}`;
}

import { createContext, useContext, useMemo } from 'react';

/*
 * 正文引註的編號。站主 2026-08-19 裁定：預設不再把被引的整句畫上點線，改成學術體例的
 * 編號腳註，並定在共用層，各站不自己編一套。
 *
 * 編號按渲染順序、以來源 id 首次出現為準：同一條來源在一篇裡永遠是同一個號，第二次引用
 * 不另給新號。這與章末 SourcesList 的編號同一個順序（那份掃 DOM 的 span[data-cite]，
 * DOM 順序就是渲染順序），兩邊因此不必互相通報也對得起來。
 *
 * 為什麼要一個 provider 而不是在元件內部各自數：一篇文章的引註散在 MDX 各處，只有共同的
 * 祖先看得到全部。ArticleLayout 已經是每篇文章的祖先，所以它自己掛一個，頁面不必記得——
 * 「頁面要記得掛某個東西」這種判準一律做進元件（2026-08-14 德川頁那次的裁定）。
 *
 * resetKey 換值就換一本新的號碼簿。切語言時整篇 MDX 抽換，引註的出現順序可能跟著變，
 * 舊的號碼簿留著就會給出上一個語言的號。
 */
const CiteNumberingContext = createContext(null);

export function createCiteRegistry() {
  const assigned = new Map();
  return {
    numberFor(id) {
      if (!id) return null;
      if (!assigned.has(id)) assigned.set(id, assigned.size + 1);
      return assigned.get(id);
    },
  };
}

export function CiteNumbering({ resetKey, children }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const registry = useMemo(() => createCiteRegistry(), [resetKey]);
  return (
    <CiteNumberingContext.Provider value={registry}>{children}</CiteNumberingContext.Provider>
  );
}

let warned = false;

/*
 * 沒有 provider 時回 null，並且只警告一次。號碼給不出來的時候寧可不印號：各自從 1 開始數
 * 會在同一頁上出現兩個 1，而讀者看不出是兩本號碼簿。
 *
 * enabled 為偽時連號都不給：資料倉找不到條目的引用不印號，章末清單也跳過它
 * （SourcesList 的 `!sources?.[id]` 那一行），兩邊要跳過同一批，否則正文的號碼會比清單
 * 多一號，而多出來的那一號在畫面上看不出來。
 */
export function useCiteNumber(id, enabled = true) {
  const registry = useContext(CiteNumberingContext);
  if (!enabled) return null;
  if (!registry) {
    if (!warned && typeof console !== 'undefined') {
      warned = true;
      console.warn('[phenom-ui] HoverCite 不在 CiteNumbering 之內，引註不會有編號。把正文包進 ArticleLayout，或自己掛一層 <CiteNumbering>。');
    }
    return null;
  }
  return registry.numberFor(id);
}

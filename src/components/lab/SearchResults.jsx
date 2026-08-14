import { Link } from 'react-router-dom';

/*
 * 全站檢索的結果清單。
 *
 * 為什麼放在共用倉：接檢索 API 的站不只一個，而每一站的結果長相是同一件事——
 * 一列一則命中，標題、它在哪一頁哪一節、一段帶高亮的原文。稅法課程筆記（D1 FTS5）
 * 先用；其他站接上自己的檢索之後同一個形狀照用。
 *
 * 契約：呼叫端把自己的 API 回傳攤平成下面這個形狀，元件不認識任何一站的欄位名。
 *   results: [{ id, href, title, context?: string[], snippetHtml?, exact? }]
 *   context 是這則命中所在的位置（學期、課程、頁名這類），依序印在標題下方。
 *   snippetHtml 是已經上好 <mark> 的一段原文——高亮由產生摘要的那一端決定，
 *   元件只負責排版；它信任呼叫端已經跳脫過角括號（API 端做，見各站的檢索函式）。
 *   exact 為真時列上標一枚「整詞」記號：整詞命中與湊齊子詞的可信度不同，讀者看得出來。
 *
 * 狀態三選一：loading 顯示等待、results 為空顯示 emptyLabel、其餘印清單。
 * 沒有輸入查詢字串時呼叫端不要渲染本元件，空手的結果頁沒有意義。
 */
export default function SearchResults({
  results = [],
  loading = false,
  emptyLabel = '沒有找到符合的內容。',
  loadingLabel = '搜尋中…',
  exactLabel = '整詞',
  className = '',
}) {
  if (loading) {
    return <p className={`text-token-sm text-ink-muted ${className}`}>{loadingLabel}</p>;
  }
  if (!results.length) {
    return <p className={`text-token-sm text-ink-muted ${className}`}>{emptyLabel}</p>;
  }

  return (
    <ol className={`space-y-6 ${className}`}>
      {results.map((item, index) => (
        <li key={item.id ?? item.href ?? index} className="border-b border-line pb-5 last:border-0">
          <Link
            to={item.href}
            className="text-token-base font-bold text-ink transition-colors duration-fast hover:text-accent"
          >
            {item.title}
          </Link>
          {item.exact ? (
            <span className="ml-2 rounded-token-sm border border-line px-1.5 py-0.5 align-middle text-token-xs text-ink-faint">
              {exactLabel}
            </span>
          ) : null}
          {item.context?.length ? (
            <p className="mt-1 text-token-xs text-ink-faint">
              {item.context.filter(Boolean).join('／')}
            </p>
          ) : null}
          {item.snippetHtml ? (
            <p
              className="mt-2 text-token-sm leading-relaxed text-ink-muted [&_mark]:bg-accent-soft [&_mark]:text-accent"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: item.snippetHtml }}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

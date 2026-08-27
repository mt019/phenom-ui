import { ExternalLink } from 'lucide-react';
import HoverCard from './HoverCard';
import MathText from './MathText';
import { useCiteNumber } from './citeNumbering.jsx';

/*
 * 正文裡的一條引註。被引的文字照常排，句子後面掛一顆上標編號；停在編號上出現卡片，
 * 寫誰在哪裡講的，點一下把卡片釘住才點得到裡面的連結。浮動的行為在 HoverCard，
 * 與 TermLink 共用。
 *
 * 編號來自 citeNumbering 的號碼簿（渲染順序、同一條來源同一個號），與章末 SourcesList
 * 的編號同一個順序。站主 2026-08-19 裁定編號腳註為預設體例，理由是點線只說「這句有出處」，
 * 不說是第幾條，讀者要走到章末才對得起來；學術正文本來就是用號碼對。
 *
 * 被引的文字不畫底線。基線下方那條帶的記號已經分配完了：專名號的實線、書名號的波浪、
 * 詞條頁的虛線、著重號的實心點，引註再占一種，讀者在同一條帶上要辨識的記號多一種。
 *
 * 來源物件出自資料倉：沒有 locator 的引用在那裡就過不了驗證，id 找不到條目的建置會失敗。
 */
export default function HoverCite({ source, sourceId, lang = 'zh', children }) {
  // hook 要無條件呼叫，所以號碼的取捨交給第二個參數，不用提早 return 來跳過它。
  const n = useCiteNumber(sourceId, Boolean(source));
  if (!source) return children;

  // 卡片是給讀者看的：誰、哪一本、在哪一頁、去哪裡讀。這條引用是怎麼查證的留在資料倉。
  const en = lang === 'en';
  const { author, title, year, container, url } = source;
  const locator = (en ? source.en?.locator : source.locator) ?? source.locator;
  const quote = (en ? source.en?.quote : source.quote) ?? source.quote;
  const linkLabel = en ? 'Read it' : '原文';

  const card = (
    <>
      <span className="block text-ink">
        {author}{en ? ` (${year}). ` : `（${year}）。`}{title}
      </span>
      {container ? <span className="mt-0.5 block text-ink-muted">{container}</span> : null}
      {quote ? (
        <span className="mt-1.5 block border-l-2 border-line pl-2 text-ink-muted">{quote}</span>
      ) : null}
      {locator ? <span className="mt-1.5 block text-ink-faint"><MathText>{locator}</MathText></span> : null}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-accent hover:underline"
        >
          {linkLabel} <ExternalLink size={11} />
        </a>
      ) : null}
    </>
  );

  // data-cite 留在外層：章末的 SourcesList 掃它生清單、放錨點，並按 DOM 順序編號——
  // 與這裡的號碼簿同一個順序。
  return (
    <span data-cite={sourceId} className="scroll-mt-8">
      {children}
      {n ? (
        <HoverCard
          card={card}
          className="fn-ref"
          label={en ? `Source ${n}` : `資料來源第 ${n} 條`}
        >
          {n}
        </HoverCard>
      ) : null}
    </span>
  );
}

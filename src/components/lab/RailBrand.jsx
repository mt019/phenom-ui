import { Link } from 'react-router-dom';

/*
 * 左欄頂端的站名塊。連續滾動的長流捲進正文之後，大標已經在視窗外，畫面上要有
 * 一處寫著讀者身在哪個站、點一下回到門口。版式照 iias 站的 sidebarBrand：
 * 墨底方塊放一枚圖示，右邊兩行——站名與副題。
 *
 * 放進 ArticleLayout 的 navBrand 槽時，它釘在左欄捲動容器之外，目次自己捲動
 * 也不跟著走（見 ArticleLayout 左欄那段）。
 */
export default function RailBrand({ icon = null, title, subtitle = null, to }) {
  return (
    <Link
      to={to}
      className="group mb-3.5 flex w-full items-center gap-3 border-b border-line-soft pb-3.5"
    >
      {icon ? (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-ink text-paper">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <strong className="block font-display text-token-body font-medium leading-tight text-ink group-hover:underline">
          {title}
        </strong>
        {subtitle ? (
          <span className="mt-0.5 block text-token-sm text-ink-muted">{subtitle}</span>
        ) : null}
      </span>
    </Link>
  );
}

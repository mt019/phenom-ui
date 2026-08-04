import { useEffect, useRef } from 'react';
import useHeadings from './useHeadings';

/*
 * "On this page": the headings of the article that is actually on screen, read
 * out of the DOM rather than declared by hand, so a heading added to the .mdx
 * shows up here without anyone maintaining a list. The entry for the section the
 * reader is currently in stays marked as they scroll.
 *
 * 量測本身在 useHeadings。版型殼（ArticleLayout、DashboardLayout）自己呼叫那支 hook，
 * 因為它要先知道有沒有標題，才決定右欄那條軌道留不留；量完把結果用 items／active 傳進來，
 * 於是同一頁的手機版（details）與桌機版（側欄）兩份目次共用一次量測。單獨用這個元件的
 * 頁面不傳 items，它就自己量。
 */
export default function TableOfContents({
  containerRef, label = '本頁目次', refreshKey, levels = [2, 3], items, active,
  metaIds = ['notes', 'sources'],
}) {
  // hook 不能寫在條件裡：外面已經量好時就不給它容器，它會回一份空的。
  const own = useHeadings(items ? null : containerRef, { levels, refreshKey });
  const list = items ?? own.items;
  const current = items ? active : own.active;

  // 側欄容器有高度上限（見 ArticleLayout 的 max-h + overflow-y-auto），標題一多，目次
  // 內容比容器高。sticky 定位本身沒問題（容器釘在 top:64px 沒有跟丟），但容器內部的捲動
  // 要靠自己追——目前這一節如果落在容器可視範圍外，讀者只看得到側欄不動，感覺像整條側欄
  // 壞掉，其實是內部沒有跟讀者一起往下捲。current 換了就把那一項捲進容器的可視範圍；
  // nearest 只動側欄容器，不動視窗本身（容器已經在視窗內，等於不做多餘捲動）。
  const activeRef = useRef(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [current]);

  if (list.length === 0) return null;

  // 章末的註釋、出處是兩個 h2，跟正文標題一起被 useHeadings 掃進來，不分隔的話目次
  // 讀起來像是文章結構的延伸，其實是另一種東西（引用清單，不是內容）。找第一個落在
  // metaIds 裡的項目，前面插一條線，metaIds 之後不再插——只分一次，不是每條註都分。
  const firstMetaIdx = list.findIndex((it) => metaIds.includes(it.id));

  return (
    <nav aria-label={label} className="text-token-xs leading-relaxed">
      <p className="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <ul className="space-y-1.5 border-l border-line-soft">
        {list.map((it, idx) => {
          const on = it.id === current;
          return (
            /*
             * 階層要看得出來，靠的不只是縮排：只差十個 px 的兩排字，讀者讀到的是一份平的
             * 清單。第一級用正常字面、深一階的墨色，第二級縮排並降一級字級——文章有兩層
             * 結構時，側欄就長得跟正文一樣有兩層。文章本身只有一級標題的話，這裡自然也是
             * 一級，那是母本的事，不是這一欄的事。
             */
            <li
              key={it.id}
              style={{
                paddingLeft: it.level >= 3 ? 24 : 12,
                ...(idx === firstMetaIdx ? { marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--c-line-soft)' } : null),
              }}>
              {/*
                * 側欄只有 13rem 寬，長標題在這裡最多折兩行，第三行起截斷（滑過去看完整標題）。
                * line-break: strict 讓中日文的斷行避開「（」「）」「、」這些位置——沒有它，
                * 「倚音（上方與下方）」會斷成「…（上方與下」＋「方）」，讀起來像壞掉。
                * text-wrap: pretty 讓最後一行不會只剩一兩個字。
                */}
              <a
                ref={on ? activeRef : null}
                href={`#${it.id}`}
                title={it.full}
                className={`-ml-px block border-l-2 py-0.5 pl-2 transition-colors duration-fast [line-break:strict] [text-wrap:pretty] line-clamp-2${
                  it.level >= 3 ? ' text-[0.92em]' : ''
                }`}
                style={{
                  borderColor: on ? 'var(--c-accent)' : 'transparent',
                  color: on ? 'var(--c-ink)' : (it.level >= 3 ? 'var(--c-ink-faint)' : 'var(--c-ink-muted)'),
                }}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

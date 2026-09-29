import { useEffect, useRef, useState } from 'react';
import { List, PanelRight, X } from 'lucide-react';

/*
 * 窄螢幕的導覽入口：左下角一顆常駐的膠囊，點開是從側邊滑出的抽屜。
 *
 * 寬螢幕的兩條側欄（ArticleLayout 的左欄目次與右欄、DashboardLayout 的右欄大綱與篩選）
 * 在 lg 以下是藏起來的。先前的補法是頁面自己傳 mobileNavLabel，殼在正文頂端放一塊摺疊
 * 的 details——不傳就什麼都沒有，傳了也只在頁頂，讀者捲進正文之後回不去。2026-09-29
 * 站主在手機上看朱家驊站：站內七個入口、篇名搜尋、全書目次、現在讀的這一篇在原書哪幾頁，
 * 一樣都找不到。判準因此收進殼裡：側欄有東西，窄螢幕就一定有這顆膠囊，頁面不必記得開。
 *
 * 膠囊放左下角：右下角是 BackToTop，頂端是 BackLink 的浮動熱區與 SiteHeader。
 * 抽屜內的連結被點到就收起（事件委派看 closest('a')），分組的展開鈕不是連結，不會誤收。
 * 讀者點同一頁的錨點時，頁面自己的 onClick 先跑完捲動，冒泡到這裡才收抽屜。
 */
export default function MobileRail({ panels = [] }) {
  const list = panels.filter((p) => p && p.content);
  const [openKey, setOpenKey] = useState(null);
  const panelRef = useRef(null);
  const open = list.find((p) => p.key === openKey) ?? null;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpenKey(null); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // 打開時從頂端顯示：頂端是站內導覽與篇名搜尋，讀者在手機上點這顆鈕多半是要找它們。
    // BookTree 掛載時會把目前那篇捲到欄中央（寬螢幕左欄要的行為），在抽屜裡那會把站內入口
    // 捲出畫面（2026-09-29 實測），所以等它跑完的下一個 frame 再歸零。目前那篇仍有標記。
    const raf = window.requestAnimationFrame(() => {
      if (panelRef.current) panelRef.current.scrollTop = 0;
    });
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (list.length === 0) return null;

  const onPanelClick = (e) => {
    if (e.target.closest && e.target.closest('a')) setOpenKey(null);
  };

  return (
    <>
      <div
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-30 flex items-stretch overflow-hidden rounded-full border border-line bg-paper/95 text-token-sm text-ink shadow-sm backdrop-blur-sm lg:hidden"
        role="toolbar"
        aria-label="頁面導覽"
      >
        {list.map((p, i) => {
          const Icon = p.side === 'right' ? PanelRight : List;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setOpenKey(p.key)}
              aria-expanded={openKey === p.key}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 transition-colors duration-fast hover:text-accent ${
                i > 0 ? 'border-l border-line-soft' : ''
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {p.label}
            </button>
          );
        })}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={open.label}>
          <button
            type="button"
            aria-label="關閉"
            className="absolute inset-0 h-full w-full cursor-default"
            style={{ background: 'color-mix(in srgb, var(--c-ink) 32%, transparent)' }}
            onClick={() => setOpenKey(null)}
          />
          <div
            onClick={onPanelClick}
            className={`absolute inset-y-0 flex w-[min(22rem,86vw)] flex-col bg-paper shadow-token-sm ${
              open.side === 'right' ? 'right-0 border-l' : 'left-0 border-r'
            } border-line-soft`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-line-soft px-4 py-2.5">
              <span className="text-token-sm text-ink-muted">{open.label}</span>
              <button
                type="button"
                onClick={() => setOpenKey(null)}
                aria-label="關閉"
                className="-mr-2 inline-flex h-9 w-9 items-center justify-center text-ink-muted hover:text-accent"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {open.head ? <div className="shrink-0 px-4 pt-4">{open.head}</div> : null}
            <div ref={panelRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
              {open.content}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

import { useEffect, useState } from 'react';
import AppearanceMenu from './AppearanceMenu.jsx';
import BackLink from './BackLink.jsx';
import FontSizeControl from './FontSizeControl.jsx';
import LangSwitch from './LangSwitch.jsx';
import { SHELL_PAD_X_RAIL, SHELL_PAD_X_TIGHT } from './shellPadding.js';

const WIDTHS = {
  article: 'max-w-[86rem]',
  prose: 'max-w-[52rem]',
};

const PAD_X = {
  article: SHELL_PAD_X_RAIL,
  prose: SHELL_PAD_X_TIGHT,
};

/*
 * 拆出去的主題站共用的抬頭列。返回鍵的隱形與熱區全在 BackLink 自己身上（2026-08-17：
 * 這一列原本掛 `group`，於是游標掃過整條列的任何位置箭頭都會浮出來），這裡只決定它
 * 放在哪。`backIndexHref` 保留連點兩下回站群清單的隱藏入口。
 */
export default function SiteHeader({
  back,
  backIndexHref,
  width = 'article',
  lang,
  onLangChange,
  scale,
  onScaleChange,
  // 常駐檢索：接了全站檢索的站（稅法課程筆記先用）把自己的檢索框放進來，讀者在任何
  // 一頁都打得了字。不傳就與現狀相同，這一列還是只有返回鍵與那三顆。
  search = null,
  sticky = false,
}) {
  // 這一列平常只裝返回鍵、字級與外觀三顆。寬螢幕上內容量撐不起整條磨砂底加分隔線，所以
  // 預設待在頁首、跟著捲走；真的需要隨時搆得到的站（長表格、逐段對照）才傳 sticky。
  // 窄螢幕不一樣：捲進正文之後這三顆沒有別的入口（2026-09-29 站主在手機上看朱家驊站，
  // 「什麼工具列都找不到」）。窄螢幕因此一律吸頂，往下讀時收起、往回捲一點就出現，
  // 與手機瀏覽器網址列的行為相同，不佔讀正文時的畫面。
  const hidden = useHideOnScrollDown();
  const chrome = sticky
    ? 'sticky top-0 z-40 border-b border-line-soft bg-paper/95 backdrop-blur-sm'
    : `max-lg:sticky max-lg:top-0 max-lg:z-40 max-lg:bg-paper/95 max-lg:backdrop-blur-sm max-lg:transition-transform max-lg:duration-200 ${
      hidden ? 'max-lg:-translate-y-full' : ''
    }`;
  return (
    <div className={`mb-6 ${chrome}`}>
      <div className={`mx-auto flex items-center justify-between gap-4 py-2 ${PAD_X[width] ?? PAD_X.article} ${WIDTHS[width] ?? WIDTHS.article}`}>
        <BackLink back={back} indexHref={backIndexHref} />
        {/* 檢索框吃掉中間的空間，但留一個上限：這一列在寬螢幕上有 86rem，整條都給輸入框
            會讓游標跑到離兩端都很遠的地方。沒有檢索的站照舊由空白撐開。 */}
        {search ? (
          <div className="min-w-0 flex-1 px-4 sm:px-8">
            <div className="max-w-xl">{search}</div>
          </div>
        ) : <span className="flex-1" />}
        <div className="flex items-center gap-2">
          {onLangChange ? <LangSwitch lang={lang} onChange={onLangChange} /> : null}
          {onScaleChange ? <FontSizeControl scale={scale} onChange={onScaleChange} /> : null}
          <AppearanceMenu lang={lang} />
        </div>
      </div>
    </div>
  );
}

// 往下捲超過抬頭列的高度就收起，往回捲 8px 以上就出現；頁頂一律出現。
// 初值是出現：預先渲染沒有捲動位置，第一幀要跟 HTML 一致。
function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (y < 64) setHidden(false);
        else if (y > last + 4) setHidden(true);
        else if (y < last - 8) setHidden(false);
        else return;
        last = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return hidden;
}

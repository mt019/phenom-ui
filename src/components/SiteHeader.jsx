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
  sticky = false,
}) {
  // 這一列平常只裝返回鍵、字級與外觀三顆。內容量撐不起整條磨砂底加分隔線，所以預設就待在
  // 頁首、跟著捲走。真的需要隨時搆得到的站（長表格、逐段對照）才傳 sticky。
  const chrome = sticky
    ? 'sticky top-0 z-40 border-b border-line-soft bg-paper/95 backdrop-blur-sm'
    : '';
  return (
    <div className={`mb-6 ${chrome}`}>
      <div className={`mx-auto flex items-center justify-between gap-4 py-2 ${PAD_X[width] ?? PAD_X.article} ${WIDTHS[width] ?? WIDTHS.article}`}>
        <BackLink back={back} indexHref={backIndexHref} />
        <span className="flex-1" />
        <div className="flex items-center gap-2">
          {onLangChange ? <LangSwitch lang={lang} onChange={onLangChange} /> : null}
          {onScaleChange ? <FontSizeControl scale={scale} onChange={onScaleChange} /> : null}
          <AppearanceMenu lang={lang} />
        </div>
      </div>
    </div>
  );
}

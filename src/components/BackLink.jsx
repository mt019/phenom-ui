import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/*
 * 全站唯一的返回鍵。三個殼（PageShell／DashboardLayout／SiteHeader）與所有自己刻版型的
 * 頁面都畫這一個元件，落點來自 `src/backNav.js`。
 *
 * 之前是每頁自己寫：有的回素首頁、有的回專案清單、有的把人送回 canvas 根、十一頁乾脆
 * 沒有。返回鍵不是頁面的內容，是站的規矩，所以它只該有一份實作。
 *
 * **安靜。** 回自己家的路不必掛招牌——落點沒有 `label` 時只畫一個箭頭，站名不印在每一頁的
 * 左上角（那是廣告不是導覽）。帶字的只有主題站的落點（「朱家驊研究室」），那是在告訴讀者
 * 他正要回到哪個站。
 *
 * **預設隱形，滑過去才浮出來**（2026-07-28 使用者裁定）。它照樣佔著位置（不是
 * display:none），浮出來時不會把旁邊的東西推開。**鍵盤一定看得見**（`focus-visible`）——
 * 只靠 hover 的隱形控制項對鍵盤使用者等於不存在，那不是安靜，是壞掉。
 *
 * **熱區就在箭頭身上，外圈只多 4px**（負外距補回來，版面不動）。到 v0.1.29 為止，`group`
 * 掛在三個殼那一整列 flex 上，於是游標掃過標題、右側控制項與整片空白都會讓箭頭浮出來
 * （2026-07-30 使用者在 canvas 說過一次「hover 顯示箭頭的範圍也太大了吧」，canvas 當時
 * 就改了，這個套件沒跟上；2026-08-17 站主在拆出去的站上又看到同一件事）。隱形的東西要
 * 靠近它才顯形，一整列都算靠近就等於沒有隱形。三個殼的 `group` 已經拿掉，熱區只由這個
 * 元件決定，全站一種行為。
 *
 * `className` 加在箭頭上（頁面級 CSS 變數、CSS Module class），**不再整份替換樣式**——
 * 舊版寫 `className || QUIET`，呼叫端一傳樣式就把隱形換掉。位置由呼叫端決定，這個元件
 * 不假設自己被放在哪裡。
 *
 * `floating` 給沒有抬頭列可掛的滿版工具頁：貼左上角，同樣隱形，靠自身那塊內距接住游標。
 */
const QUIET = 'phenom-back-link--quiet text-token-sm text-ink-muted transition duration-fast '
  + 'group-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100 '
  + 'hover:text-[var(--backlink-accent,var(--c-accent))]';

// 負外距把內距抵掉，熱區比箭頭大一圈而版面不動。
const ZONE = 'group -m-1 block w-fit shrink-0 p-1';

const FLOATING = 'rounded-token-md px-1 text-token-xs text-ink-muted '
  + 'phenom-back-link--quiet transition duration-fast focus-visible:opacity-100 '
  + 'group-hover:opacity-100 hover:bg-paper hover:opacity-100 '
  + 'hover:text-[var(--backlink-accent,var(--c-accent))] focus-visible:bg-paper';

const FLOATING_ZONE = 'group fixed left-1 top-1 z-50 block p-2';

/*
 * 連點兩下回專案清單（2026-07-28 使用者裁定）。
 *
 * **只有落點是素首頁的那些返回鍵才有這件事**：主題站內頁的返回鍵（「← 簡報」）連點兩下
 * 沒有第二個意思，照原樣一下就走。
 *
 * 瀏覽器沒有「這是雙擊的第一下」這種事件，所以單擊必須先等一小段（下面的 DOUBLE_MS），
 * 確認沒有第二下才走。這個延遲是這個功能的成本，不是 bug：它落在最常用的那一下。
 * 三件事一定要留著，不然就是拿一個小把戲換掉瀏覽器本來就對的行為：
 *
 * 1. `href` 照舊指向素首頁——cmd／ctrl 點開新分頁、中鍵、右鍵選單、「複製連結網址」
 *    全部走原生，那些路徑一秒都不延遲（下面看到修飾鍵就直接放行）。
 * 2. **鍵盤不等待**：Enter 觸發的 click 其 `detail` 是 0，直接走，不要讓鍵盤使用者
 *    陪這 260 毫秒。
 * 3. 元件卸載時把計時器清掉，免得在已經離開的頁面上導覽。
 */
const DOUBLE_MS = 260;

/*
 * 預設落點是站群首頁，不是 `/`。
 *
 * 2026-08-17：統計站拆出去之後每一頁都沒有傳 `back`，於是十二頁全部畫出 `href="/"`——
 * 站首頁上那個箭頭指向它自己，點了不動。這個套件的消費端都是拆出去的主題站，沒有一個站
 * 的返回鍵該指向自己的根路徑，所以預設值改成站群首頁；canvas 不消費這個套件（它有自己
 * 的一份），改這裡動不到它。
 *
 * 預設值只擋「連結指向自己」這一種。哪一頁該回到哪裡仍然要各站自己寫，未傳值時下面會印
 * 一句 warning，跨站的檢查在 phenom-ops/scripts/check-back-link.mjs。
 */
const CANVAS_HOME = { href: 'https://phenomcanvas.com/', label: '', title: '回 Phenom Canvas' };
const CANVAS_INDEX = 'https://phenomcanvas.com/all';

export default function BackLink({
  className = '',
  back,
  indexHref,
  floating = false,
}) {
  const navigate = useNavigate();
  const timer = useRef(null);
  const [touchRevealed, setTouchRevealed] = useState(false);
  useEffect(() => () => clearTimeout(timer.current), []);

  // `back={null}` 仍然是「這頁不畫返回鍵」；只有整個沒傳才套預設值。
  const link = back === undefined ? CANVAS_HOME : back;
  const index = indexHref === undefined ? (back === undefined ? CANVAS_INDEX : null) : indexHref;
  if (!link) return null;

  if (back === undefined && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    console.warn('[phenom-ui] BackLink 沒有收到 back，暫用站群首頁。落點要各站自己寫，見 phenom-ops/scripts/check-back-link.mjs');
  }

  const label = link.label || '';
  const doubleClickable = Boolean(index && index !== link.href);
  /*
   * **不掛 `title`。** 瀏覽器那個原生提示框是系統畫的，跟這個站的字體與顏色沒有任何關係，
   * 停在箭頭上一秒就跳出來一塊灰框（使用者 2026-07-28：「這個 hover 框框也太醜了」）。
   * 而且它會把連點兩下那個隱藏入口寫成說明文字——隱藏入口一旦有說明就不是隱藏入口了。
   * 螢幕閱讀器需要的名字由 `aria-label` 給，那個不會畫出任何東西。
   */
  const label_ = label ? `回${label}` : '回首頁';
  const go = (target) => {
    try {
      const url = new URL(target, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.assign(url.href);
        return;
      }
    } catch { /* React Router will handle relative paths. */ }
    navigate(target);
  };

  const onClick = (e) => {
    // 修飾鍵與非左鍵一律讓給瀏覽器：開新分頁、複製網址這些不該被攔。
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    // detail 0＝鍵盤觸發的，不等。
    if (e.detail === 0) return;
    // 觸控沒有 hover：第一次點左上角只叫出箭頭，不偷走這次點擊去導覽。
    if (window.matchMedia?.('(hover: none)').matches && !touchRevealed) {
      e.preventDefault();
      setTouchRevealed(true);
      return;
    }
    if (!doubleClickable) return;
    e.preventDefault();
    if (e.detail >= 2) {
      clearTimeout(timer.current);
      go(index);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => go(link.href), DOUBLE_MS);
  };

  return (
    <span className={floating ? FLOATING_ZONE : ZONE}>
      <Link
        to={link.href}
        aria-label={link.title || label_}
        onClick={onClick}
        className={`${floating ? FLOATING : QUIET} ${className} ${touchRevealed ? 'phenom-back-link--revealed' : ''}`.trim()}
      >
        {label ? `← ${label}` : '←'}
      </Link>
    </span>
  );
}

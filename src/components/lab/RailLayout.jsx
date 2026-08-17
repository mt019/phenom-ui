import BackLink from '../BackLink';
import Eyebrow from '../Eyebrow';
import { SHELL_PAD_X_RAIL } from '../shellPadding';
import Tabs from './Tabs';

/*
 * 左欄常駐導覽＋滿寬工作區。第三個殼，與另外兩個的分工：
 *
 *   ArticleLayout    左欄章節導覽、中間 44rem 閱讀欄、右欄目次——服務一篇長文。
 *   DashboardLayout  抬頭在上、分頁列吸在頂端、內容滿寬——分頁是「看哪一期／哪個視圖」。
 *   RailLayout       導覽與識別整條收在左邊，右邊整片留給工作區。
 *
 * 第三種的意圖是檢索：讀者在一批資料裡切檢視、搜尋、篩選，切換之後仍要看得到自己在哪一區，
 * 所以導覽不能隨頁面捲走，也不值得再花一條橫向的吸頂列。中研院法研所出版品頁
 * （phenom-iias）與司法院外國法翻譯索引（phenom-judicial-translations）各自刻過一份，
 * 前者用 CSS Module、後者用 Tailwind，版型相同而實作兩套；2026-08-17 抽成這個殼，
 * 從後者搬過來（它的零件本來就全部取自本套件）。
 *
 * 窄屏不留左欄：`contents` 讓 aside 的子元素直接排進外層流，識別在最上面，導覽那一列
 * 改成吸頂。`flex-wrap` 而不是橫捲——吸頂列橫捲的話，捲到一半的按鈕會被切掉而讀者不會
 * 去捲它（各倉的 validate-shell-chrome 也擋這件事）。lg 起導覽變成左欄的直排格線，
 * 本來就沒有橫向問題。
 */
export default function RailLayout({
  scale,
  // 返回鍵。每一頁都要傳：`{ href, label }` 說這頁回哪裡，`null` 說這頁不畫。
  // 跨站檢查在 phenom-ops/scripts/check-back-link.mjs。
  back,
  backIndexHref,
  // 返回鍵同一列的右側，通常是外觀與字級控制。
  headerRight,
  eyebrow,
  title,
  // 傳了就把眉標與標題變成按鈕（多半是回本頁的第一個檢視）。
  onHome,
  homeTitle,
  // 左欄的檢視切換：{ label, value, onChange, items }，items 的形狀同 Tabs。
  nav,
  // 導覽底下的常駐內容——隨機翻閱、今日一則、通往姊妹頁的連結這類。
  rail,
  // 內距預設留一半：左欄本身已經隔開內容與螢幕邊（見 shellPadding.js）。
  padX = SHELL_PAD_X_RAIL,
  children,
}) {
  const identity = (
    <>
      {eyebrow ? <Eyebrow className="mb-1">{eyebrow}</Eyebrow> : null}
      <h1 className="font-display text-token-lg leading-tight text-ink transition-colors duration-fast group-hover:text-accent lg:text-token-xl">
        {title}
      </h1>
    </>
  );

  return (
    <main data-search-root className="min-h-screen bg-paper paper-texture text-ink" style={{ '--reader-scale': scale }}>
      <div className={`mx-auto max-w-7xl ${padX}`}>
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
          <aside className="contents lg:block lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:border-r lg:py-5 lg:pr-5">
            {/* 熱區在 BackLink 自己身上，這一列不掛 group（2026-08-17）。 */}
            <div className="flex items-center justify-between gap-2 pt-5 lg:flex-col lg:items-start lg:gap-3 lg:pt-0">
              <BackLink back={back} indexHref={backIndexHref} />
              {headerRight ? <div className="flex shrink-0 items-center gap-2">{headerRight}</div> : null}
            </div>

            {onHome ? (
              <button type="button" onClick={onHome} title={homeTitle} className="group mt-4 block text-left">
                {identity}
              </button>
            ) : (
              <div className="mt-4">{identity}</div>
            )}

            {nav ? (
              <nav className="sticky top-0 z-20 mt-5 border-b border-line-soft bg-paper py-2 lg:static lg:z-auto lg:border-b-0 lg:bg-transparent lg:py-0">
                <Tabs variant="rail" label={nav.label} value={nav.value} onChange={nav.onChange} items={nav.items} />
              </nav>
            ) : null}

            {rail}
          </aside>

          <div className="reader-scale min-w-0 py-8">{children}</div>
        </div>
      </div>
    </main>
  );
}

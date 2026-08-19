import { createContext, useContext, useMemo } from 'react';
import MathText from './MathText.jsx';

/*
 * 圖表編號。站主 2026-08-19 裁定要有編號，並且定在共用層——各站不自己編一套，也不把號碼
 * 寫進元件或正文。
 *
 * 號碼的來源是資料層：`figures.json` 是一份陣列，順序就是文章裡的出現順序，建置端
 * （統計站是 build-app-json.mjs）依那個順序給每一筆一個 `number`。不按渲染順序現場指派，
 * 是因為正文的「見圖 4」會出現在那張圖之前，現場指派會把號碼給先講到它的那一句。
 *
 * 元件端因此只做兩件事：查號、印「圖 N｜題目」。中文 `圖 N`、英文 `Figure N`。
 */
const FigureNumberingContext = createContext(null);

const PREFIX = { zh: '圖', en: 'Figure' };

export function FigureNumbering({ figures, lang = 'zh', children }) {
  const value = useMemo(() => {
    const list = Array.isArray(figures) ? figures : Object.values(figures ?? {});
    const numbered = list.filter((f) => f && f.id);
    // 資料層給了 number 就照它排；沒給（舊資料）退回列出的順序，兩種都是穩定的順序。
    const ordered = numbered.every((f) => Number.isFinite(f.number))
      ? [...numbered].sort((a, b) => a.number - b.number)
      : numbered;
    const map = new Map();
    ordered.forEach((f, i) => {
      map.set(f.id, {
        number: Number.isFinite(f.number) ? f.number : i + 1,
        title: (lang === 'en' ? f.en?.title : f.title) ?? f.title ?? null,
      });
    });
    return { map, lang };
  }, [figures, lang]);

  return (
    <FigureNumberingContext.Provider value={value}>{children}</FigureNumberingContext.Provider>
  );
}

let warned = false;

/*
 * 查不到就回 null，元件照樣渲染、只是不印號。查不到的兩種情形都不該讓畫面壞掉：頁面忘了掛
 * provider，或這張圖不在資料層的清單上。前者警告一次——靜默失效的檢查等於沒有檢查。
 */
export function useFigure(id) {
  const ctx = useContext(FigureNumberingContext);
  if (!ctx) {
    if (!warned && typeof console !== 'undefined') {
      warned = true;
      console.warn('[phenom-ui] 圖表不在 FigureNumbering 之內，不會有編號。把正文包進 <FigureNumbering figures={figures} lang={lang}>。');
    }
    return null;
  }
  const hit = ctx.map.get(id);
  if (!hit) return null;
  return { ...hit, prefix: PREFIX[ctx.lang] ?? PREFIX.zh };
}

export function figureAnchorId(id) {
  return id ? `fig-${id}` : undefined;
}

/*
 * 號碼單獨包一層，才吃得到 .fig-num 的 accent 字面（Erikas 700 的油墨網點）。「圖」那個字
 * 留在正文字體裡——accent 那支沒有漢字，包進去只會退回明體的粗體，兩種粗細混在同一行。
 */
export function FigureLabel({ prefix, number }) {
  return (
    <>
      {prefix}
      {' '}
      <span className="fig-num">{number}</span>
    </>
  );
}

/*
 * 正文裡指涉某一張圖。號碼由資料層決定，作者只寫 id，所以插圖、換序、刪圖都不會讓正文的
 * 號碼與圖對不上——手打「見圖 4」正是會對不上的那種寫法。
 */
export function FigRef({ id }) {
  const fig = useFigure(id);
  if (!fig) return null;
  return (
    <a href={`#${figureAnchorId(id)}`} className="text-ink underline decoration-line underline-offset-2">
      <FigureLabel prefix={fig.prefix} number={fig.number} />
    </a>
  );
}

/*
 * 圖題與說明。題目來自資料層的 figures.json，說明由元件自己給（互動圖的說明帶著當下的
 * 數值，那是渲染時才知道的）。
 */
export function FigureCaption({ id, caption, className = 'mt-2 text-token-xs leading-relaxed text-ink-faint' }) {
  const fig = useFigure(id);
  if (!fig && !caption) return null;
  return (
    <figcaption className={className}>
      {fig ? (
        <span className="font-medium text-ink">
          <FigureLabel prefix={fig.prefix} number={fig.number} />
          {fig.title ? <span className="ml-2">{fig.title}</span> : null}
          {'　'}
        </span>
      ) : null}
      {typeof caption === 'string' ? <MathText>{caption}</MathText> : caption}
    </figcaption>
  );
}

/*
 * 自己畫 SVG、不走 ChartFrame 的圖（帶滑桿的那幾張、並排兩格的那幾張）用這個外框，
 * 才不會各站各自寫一份 <figure> 而編號長相不一。
 */
export function FigureBlock({ id, caption, captionClassName, className = 'my-6', children }) {
  return (
    <figure id={figureAnchorId(id)} className={className}>
      {children}
      <FigureCaption id={id} caption={caption} {...(captionClassName ? { className: captionClassName } : {})} />
    </figure>
  );
}

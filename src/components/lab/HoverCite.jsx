import { ExternalLink } from 'lucide-react';
import HoverCard from './HoverCard';
import MathText from './MathText';

/*
 * A source marker on a claim. Hover the cited words to see who said it and
 * where; click to pin the card so you can reach the link inside it. The floating
 * behaviour lives in HoverCard, which TermLink shares.
 *
 * Deliberately narrow: no numbering, no bibliography, no back-links. The source
 * object comes from the data repo, where a citation with no locator fails
 * validation and an id with no entry fails the build.
 */
export default function HoverCite({ source, lang = 'zh', children }) {
  if (!source) return children;

  // The card is reader-facing: author, work, where in it, and a way to read it.
  // Anything about how the citation was checked stays in the data repo.
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

  // No asterisk on the marker. A marker is one more character, and Chinese breaks
  // between any two characters, so it gets orphaned onto the next line just as the
  // punctuation did. The dotted underline says the same thing and cannot be.
  return (
    <HoverCard
      card={card}
      // 底線走 text-decoration，不用 border-bottom：行內公式的盒子比一行中文高，border
      // 畫在盒子的底緣，分數的分母因此被那條虛線穿過去（2026-08-13 站主截圖）。
      // text-decoration 畫在基線下方的固定位置，配上 katex.css 讓 .katex 成為 atomic
      // inline，線就不會延進公式裡。
      className="cursor-help underline decoration-dotted decoration-ink-faint underline-offset-[0.3em] [text-decoration-skip-ink:auto] transition-colors duration-fast hover:decoration-accent hover:text-accent"
    >
      {children}
    </HoverCard>
  );
}

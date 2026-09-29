import { useEffect, useRef, useState } from 'react';

/*
 * 標題旁的「#」：點了把這一節的網址寫進網址列並複製到剪貼簿，讀者拿去引用或傳給別人。
 *
 * 來歷：2026-09-29 站主在朱家驊研究室說「每個獨立篇目的 title 都做錨點可定位有需要吧」。
 * h2 早就帶 id，網址加上 #p330 也跳得到，可是頁面上沒有任何東西告訴讀者那個網址長什麼樣。
 *
 * 放在標題元素裡面、標題文字之後；父元素要帶 group，桌機滑過標題才顯出來，觸控裝置沒有
 * 滑過這回事，所以 hover: none 時常駐。鍵盤移到它身上時同樣顯出來。
 * 複製失敗（非安全來源、權限被拒）時網址列照樣改了，讀者從網址列拿得到，不另報錯。
 */
export default function HeadingAnchor({ id, label, className = '' }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.replaceState(window.history.state, '', url);
    navigator.clipboard?.writeText(url.href).then(() => {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }, () => {});
  };

  return (
    <a
      href={`#${id}`}
      onClick={onClick}
      aria-label={`複製「${label}」的連結`}
      title="複製本節連結"
      className={`ml-2 inline-block align-baseline font-sans text-token-sm font-normal text-ink-faint no-underline opacity-0 transition-opacity duration-fast hover:text-accent focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${className}`}
    >
      {copied ? <span className="text-token-xs text-ink-muted" role="status">已複製連結</span> : '#'}
    </a>
  );
}

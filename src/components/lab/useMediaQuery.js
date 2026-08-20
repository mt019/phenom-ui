import { useEffect, useState } from 'react';

/*
 * 訂閱一條 media query，回傳它此刻成不成立。
 *
 * 初值一律是 false：prerender 沒有視窗，量不到寬度，先當作不成立，掛載後的第一個
 * effect 才校正。窄屏的版面因此要寫成「成立時才換」，別把預設值當成寬屏的樣子。
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const sync = () => setMatches(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

import { useEffect } from 'react';

/*
 * 點側欄的一項要捲到那一節，時間由這裡定，不交給瀏覽器。
 *
 * 來歷：2026-08-26 站主在 phenom-wealth 說「兩個側邊欄的點擊滾動都太慢了」。成因是各站的
 * styles.css 寫著 `html { scroll-behavior: smooth }`——原生平滑捲動的速度大致是定值，
 * 位移越長跑得越久，一篇四百行的章節從章末目次跳到第一節要走好幾秒；換章時
 * ScrollToTop 的 window.scrollTo(0, 0) 也被同一條規則接管，於是連換頁都在爬。
 * CSS 沒有辦法替它設上限，所以捲動改由這裡算：時間夾在 180 到 420 毫秒之間，
 * 距離只影響落在區間內的哪個值。
 *
 * 讀者在動畫途中滾滑鼠、觸控或按鍵，就當場停手——動畫還在跑而畫面不聽使喚，比慢更糟。
 */

const MIN_MS = 180;
const MAX_MS = 420;

function reduceMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

let running = null;   // 同時只有一個捲動動畫，後來的取代先前的

/** 捲到文件座標 top。時間有上限，讀者一動就停。 */
export function scrollToY(top) {
  if (typeof window === 'undefined') return;
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const to = Math.min(Math.max(0, top), max);
  const from = window.scrollY;
  const delta = to - from;
  if (running) running();
  if (Math.abs(delta) < 4 || reduceMotion()) {
    window.scrollTo(0, to);
    return;
  }
  const duration = Math.min(MAX_MS, Math.max(MIN_MS, Math.abs(delta) / 6));
  const t0 = performance.now();
  let frame = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', stop, { passive: true });
    window.removeEventListener('touchstart', stop, { passive: true });
    window.removeEventListener('keydown', stop);
    running = null;
  };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);
  running = stop;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, from + delta * easeOutCubic(p));
    if (p < 1) frame = requestAnimationFrame(step);
    else stop();
  };
  frame = requestAnimationFrame(step);
}

/**
 * 捲到某個 id 的元素。落點扣掉該元素自己的 scroll-margin-top，與原生 hash 跳轉一致——
 * 吸頂的頁首靠那個值讓標題不被蓋住，這裡自己算落點，就得自己讀它。
 */
export function scrollToAnchor(id) {
  if (typeof document === 'undefined') return false;
  const el = document.getElementById(id)
    || document.querySelector(`[name="${CSS.escape(id)}"]`);
  if (!el) return false;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  scrollToY(el.getBoundingClientRect().top + window.scrollY - margin);
  return true;
}

/**
 * 頁內的 hash 連結（側欄目次、註標、回指）一律走上面那條路。掛在版型殼上，
 * 用事件代理接整份文件，頁面與元件不必各自改連結。
 */
export function useAnchorScroll(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined;
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const a = event.target.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href[0] !== '#' || href.length < 2) return;
      const id = decodeURIComponent(href.slice(1));
      if (!scrollToAnchor(id)) return;
      event.preventDefault();
      // 網址列要跟著換，否則讀者複製到的連結指不到這一節；用 pushState 是因為
      // 直接設 location.hash 會讓瀏覽器自己再跳一次，與這裡的動畫打架。
      history.pushState(null, '', href);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [enabled]);
}

/*
 * OKLCH 轉換與感知距離——站群唯一一份。
 *
 * 兩支矩陣原本寫在 canvas 的 PaletteLab.jsx 裡，2026-08-19 抽成 canvas 的
 * src/styles/oklch.js，2026-08-20 再搬進共用層：色票庫、色彩原理教學頁與
 * scripts/lib/color-system.mjs 的機器閘讀的是同一份帶寬，抄第二份就會漂移。
 * 其餘頁面算色一律走 CSS 的 color-mix(in oklab, …)，不 import 這支。
 *
 * 用 OKLCH 而不是 HSL 的理由：sRGB 與 HSL 的數值差距與眼睛看到的差距沒有對應關係。
 * 從純黑往上走 32 個 RGB 單位幾乎看不出來，從中灰往綠走同樣 32 個單位一眼就是兩個顏色。
 * OKLab 是為感知均勻而擬合的座標，兩色之間的歐氏距離因此可以當成「差多少」的度量。
 */

export function hexToOklch(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const s2lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [rl, gl, bl] = [r, g, b].map(s2lin);
  const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, C: Math.hypot(a, bb), H: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360, a, b: bb };
}

export function oklchToHex(L, C, hueDeg) {
  const hr = (hueDeg * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const gamma = (c) => { const cc = Math.max(0, Math.min(1, c)); return cc <= 0.0031308 ? 12.92 * cc : 1.055 * cc ** (1 / 2.4) - 0.055; };
  const ch = (c) => Math.round(Math.max(0, Math.min(1, gamma(c))) * 255).toString(16).padStart(2, '0');
  return `#${ch(r)}${ch(g)}${ch(bl)}`;
}

/* 兩色的感知距離（OKLab 歐氏）。分類色要分得開，本站門檻 0.05。 */
export function oklabDistance(hexA, hexB) {
  const A = hexToOklch(hexA);
  const B = hexToOklch(hexB);
  return Math.hypot(A.L - B.L, A.a - B.a, A.b - B.b);
}

/* 落在 sRGB 之外的 OKLCH 座標會被 oklchToHex 截斷，截斷後就不是原來那個色。 */
export function inGamut(L, C, H) {
  const hex = oklchToHex(L, C, H);
  const back = hexToOklch(hex);
  return Math.abs(back.L - L) < 0.012 && Math.abs(back.C - C) < 0.012;
}

/* 帶寬的正本。機器閘（scripts/lib/color-system.mjs）與教學頁都從這裡取。 */
export const BANDS = { txL: [0.46, 0.58], txC: [0.045, 0.13], bgL: [0.90, 0.97], bgC: [0, 0.035] };

export const outOfBand = (v, [lo, hi]) => v < lo || v > hi;

/* 分類色可辨門檻：低於它，兩支在無標籤時讀成同一類。 */
export const SEPARATION_MIN = 0.05;

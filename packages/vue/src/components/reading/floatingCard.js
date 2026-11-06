/*
 * 浮卡的定位，不依賴框架。React 正本是 phenom-ui 根目錄 src/components/lab/useFloatingCard.js。
 * 位置由 anchor 的實際螢幕座標計算，再限制在視窗之內；以 CSS transform 置中時，anchor
 * 靠近視窗邊緣，卡片會超出畫面。
 *
 * placement：'auto' 上方空間足夠時開在上方，'above' 一律上方，'below' 一律下方。
 */
export const CARD_GAP = 8;
export const ESTIMATED_CARD_H = 140;

export function placeFloatingCard({
  anchor,
  cardW,
  cardH,
  viewportW,
  viewportH,
  placement = 'auto',
}) {
  const above =
    placement === 'below' ? false : placement === 'above' || anchor.top > cardH + CARD_GAP + 8;
  const left = Math.min(
    Math.max(CARD_GAP, anchor.left + anchor.width / 2 - cardW / 2),
    viewportW - cardW - CARD_GAP,
  );
  const wanted = above ? anchor.top - cardH - CARD_GAP : anchor.bottom + CARD_GAP;
  const top = Math.min(Math.max(CARD_GAP, wanted), viewportH - cardH - CARD_GAP);
  return { left, top };
}

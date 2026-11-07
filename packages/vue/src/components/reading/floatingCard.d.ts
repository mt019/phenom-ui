export const CARD_GAP: number;
export const ESTIMATED_CARD_H: number;
export function placeFloatingCard(opts: {
  anchor: { top: number; bottom: number; left: number; width: number };
  cardW: number;
  cardH: number;
  viewportW: number;
  viewportH: number;
  placement?: 'auto' | 'above' | 'below';
}): { left: number; top: number };

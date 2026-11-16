// React 版 useStickyTop／useStuckToTop 在 Vue 版的對應。
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

/** 量一個吸頂元素的高度，寫成 CSS 變數（預設 --lab-sticky-top），回傳高度 ref（px）。
 *  elRef 是 ref(null)，掛載後量；targetRef 可指定寫入變數的元素，預設 documentElement。 */
export function useStickyTop(
  elRef: Ref<HTMLElement | null | undefined>,
  { varName = '--lab-sticky-top', targetRef }: { varName?: string; targetRef?: Ref<HTMLElement | null | undefined> } = {},
) {
  const height = ref(0);
  let ro: ResizeObserver | undefined;
  const stop = () => { ro?.disconnect(); ro = undefined; };
  const start = (el: HTMLElement | null | undefined) => {
    stop();
    if (!el) return;
    const host = targetRef?.value || document.documentElement;
    const apply = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      host.style.setProperty(varName, `${h}px`);
      height.value = h;
    };
    apply();
    ro = new ResizeObserver(apply);
    ro.observe(el);
  };
  onMounted(() => { start(elRef.value); watch(elRef, start); });
  onBeforeUnmount(stop);
  return height;
}

/** position:sticky 的元素此刻是否停在貼齊位置；回傳 boolean ref。 */
export function useStuckToTop(elRef: Ref<HTMLElement | null | undefined>) {
  const stuck = ref(false);
  let frame = 0;
  let el: HTMLElement | null | undefined;
  const check = () => {
    frame = 0;
    if (!el) return;
    const top = parseFloat(getComputedStyle(el).top) || 0;
    stuck.value = el.getBoundingClientRect().top <= top + 0.5;
  };
  const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(check); };
  const detach = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
  const attach = (next: HTMLElement | null | undefined) => {
    detach();
    el = next;
    if (!el) return;
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  };
  onMounted(() => { attach(elRef.value); watch(elRef, attach); });
  onBeforeUnmount(detach);
  return stuck;
}

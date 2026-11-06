<script lang="ts">
// 同一時間只開一張卡：開新卡之前先關掉上一張。
let closeActiveCard: (() => void) | null = null;
</script>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import VNodeOutlet from './VNodeOutlet';
import { CARD_GAP, ESTIMATED_CARD_H, placeFloatingCard } from './floatingCard.js';
/*
 * 包住一段文字的浮卡（引用、術語、人名）。滑過或聚焦時開啟，點擊可固定，以便點到卡內
 * 連結。卡片內容由 card prop（VNode 或字串）或 card slot 提供，正文是 default slot。
 * 正文裡由建置產生的編號註標用 AnnotatedHtml。
 *
 * 標記用 span 而不用 button：Chromium 把表單控制項當成不可分割的行內盒，標記後的句號
 * 會因此脫離同一個文字串，避頭規則管不到，句號被推到下一行行首。
 * 卡片以 Teleport 放在 body 末端，不插在段落裡，開合時段落的行盒不會位移。
 */
const props = withDefaults(
  defineProps<{
    card?: any;
    className?: string;
    interactive?: boolean;
    pinnable?: boolean;
    width?: number;
    label?: string;
    focusable?: boolean;
    placement?: 'auto' | 'above' | 'below';
    cardClassName?: string;
  }>(),
  {
    interactive: true,
    pinnable: undefined,
    width: 320,
    focusable: true,
    placement: 'auto',
    cardClassName: 'px-3.5 py-3',
  },
);
const OPEN_DELAY = 70;
const CLOSE_DELAY = 140;
const open = ref(false),
  pinned = ref(false),
  pos = ref<{ left: number; top: number } | null>(null),
  marker = ref<HTMLElement>(),
  cardEl = ref<HTMLElement>(),
  id = useId();
const canPin = computed(() => props.pinnable ?? props.interactive);
let openTimer: ReturnType<typeof setTimeout> | undefined,
  closeTimer: ReturnType<typeof setTimeout> | undefined,
  frame = 0;

function forceClose() {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  pinned.value = false;
  open.value = false;
}
function show(immediate = false) {
  clearTimeout(closeTimer);
  if (open.value) return;
  clearTimeout(openTimer);
  const reveal = () => {
    if (closeActiveCard && closeActiveCard !== forceClose) closeActiveCard();
    closeActiveCard = forceClose;
    open.value = true;
  };
  if (immediate) reveal();
  else openTimer = setTimeout(reveal, OPEN_DELAY);
}
// 指標從標記移到卡片要經過幾個像素的正文，關閉留一小段緩衝。
function hide() {
  clearTimeout(openTimer);
  if (props.interactive && pinned.value) return;
  closeTimer = setTimeout(forceClose, props.interactive ? CLOSE_DELAY : 60);
}
function togglePin() {
  show(true);
  pinned.value = !pinned.value;
}
function onClick() {
  if (canPin.value) togglePin();
}
function onKeydown(e: KeyboardEvent) {
  if (canPin.value && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    togglePin();
  }
}
function place() {
  const anchor = marker.value?.getBoundingClientRect();
  if (!anchor) return;
  pos.value = placeFloatingCard({
    anchor,
    cardW: cardEl.value?.offsetWidth ?? Math.min(props.width, window.innerWidth - CARD_GAP * 2),
    cardH: cardEl.value?.offsetHeight ?? ESTIMATED_CARD_H,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
    placement: props.placement,
  });
}
function onDocKey(e: KeyboardEvent) {
  if (e.key === 'Escape') forceClose();
}
function onDocDown(e: Event) {
  const t = e.target as Node;
  if (cardEl.value?.contains(t) || marker.value?.contains(t)) return;
  forceClose();
}
function detach() {
  cancelAnimationFrame(frame);
  document.removeEventListener('keydown', onDocKey);
  document.removeEventListener('pointerdown', onDocDown);
  window.removeEventListener('scroll', place, true);
  window.removeEventListener('resize', place);
}
// 卡片未掛載時先以估計高度定位，下一幀量到實際高度再定位一次；
// 少了第二次，頁面頂端的標記會把卡片開到畫面外。scroll 用 capture，正文可能捲在內層容器。
watch(open, async (value) => {
  detach();
  if (!value) {
    pos.value = null;
    return;
  }
  document.addEventListener('keydown', onDocKey);
  document.addEventListener('pointerdown', onDocDown);
  window.addEventListener('scroll', place, true);
  window.addEventListener('resize', place);
  place();
  await nextTick();
  frame = requestAnimationFrame(place);
});
onBeforeUnmount(() => {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  detach();
  if (closeActiveCard === forceClose) closeActiveCard = null;
});
</script>
<template>
  <span
    ref="marker"
    :role="canPin ? 'button' : undefined"
    :tabindex="focusable ? 0 : undefined"
    :aria-label="label"
    :aria-expanded="open"
    :aria-describedby="open ? id : undefined"
    :class="className"
    @mouseenter="show(false)"
    @mouseleave="hide"
    @focus="show(true)"
    @blur="hide"
    @click="onClick"
    @keydown="onKeydown"
    ><slot /></span
  ><Teleport v-if="open && pos" to="body"
    ><div
      ref="cardEl"
      role="tooltip"
      :id="id"
      @mouseenter="interactive ? show(true) : undefined"
      @mouseleave="interactive ? hide() : undefined"
      :style="{
        position: 'fixed',
        left: pos.left + 'px',
        top: pos.top + 'px',
        width: width + 'px',
        maxWidth: `calc(100vw - ${CARD_GAP * 2}px)`,
        maxHeight: '45vh',
        overflowY: 'auto',
      }"
      :class="[
        'z-30 rounded-token-md border border-line bg-surface-raised text-left text-token-xs leading-relaxed shadow-token-md',
        cardClassName,
        interactive ? '' : 'pointer-events-none',
      ]"
      ><VNodeOutlet :content="card"><slot name="card" /></VNodeOutlet></div
  ></Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BackLink from './BackLink.vue';
import AppearanceMenu from './AppearanceMenu.vue';
import VNodeOutlet from './VNodeOutlet';
const props = withDefaults(
defineProps<{
  back?: any;
  backIndexHref?: string;
  width?: string;
  lang?: string;
  onLangChange?: (v: string) => void;
  scale?: number;
  onScaleChange?: (v: number) => void;
  search?: any;
  sticky?: boolean;
  currentTitle?: string;
}>(),
  { sticky: true },
);
const hidden = ref(false),
  past = ref(false),
  h1Text = ref(''),
  titleStyle = ref<Record<string, string>>({}),
  row = ref<HTMLElement>(),
  route = useRoute();
const shown = () => past.value && !!(props.currentTitle || h1Text.value);
let h1: Element | null = null,
  mo: MutationObserver | undefined;
// 頁面主標題取 main 內第一個 h1；捲出頂列之後，頂列顯示它的文字，位置對齊正文欄左緣。
function measure() {
  const found = document.querySelector('main h1');
  if (found !== h1) {
    mo?.disconnect();
    h1 = found;
    if (h1 && typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(measure);
      mo.observe(h1, { childList: true, characterData: true, subtree: true });
    }
  }
  h1Text.value = h1?.textContent?.trim() ?? '';
  if (!h1) {
    past.value = window.scrollY > 160;
    return;
  }
  const r = h1.getBoundingClientRect();
  past.value = r.bottom < 48;
  const host = row.value?.getBoundingClientRect();
  if (host && r.width > 0) {
    // 正文欄左緣若與返回鍵重疊（手機寬度），讓到返回鍵右側。
    const back = row.value?.firstElementChild?.getBoundingClientRect();
    const left = Math.max(0, r.left - host.left, back && back.width ? back.right - host.left + 12 : 0);
    titleStyle.value = {
      left: `${left}px`,
      maxWidth: `${Math.max(0, Math.min(r.width, host.right - host.left - left - 16))}px`,
    };
  }
}
watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    measure();
  },
);
let cleanup = () => {};
onMounted(() => {
  let last = window.scrollY,
    frame = 0;
  measure();
  function scroll() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      measure();
      const y = window.scrollY;
      if (y < 64) hidden.value = false;
      else if (y > last + 4) hidden.value = true;
      else if (y < last - 8) hidden.value = false;
      else return;
      last = y;
    });
  }
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('resize', measure);
  cleanup = () => {
    window.removeEventListener('scroll', scroll);
    window.removeEventListener('resize', measure);
    mo?.disconnect();
    cancelAnimationFrame(frame);
  };
});
onBeforeUnmount(() => cleanup());
</script>
<template>
  <div
    :class="[
      'mb-6',
      sticky
        ? `phenom-site-header--sticky bg-paper/95 backdrop-blur-sm max-lg:sticky max-lg:top-0 max-lg:z-40 max-lg:transition-transform max-lg:duration-200 lg:sticky lg:top-0 lg:z-40 lg:border-b lg:border-line-soft ${hidden ? 'max-lg:-translate-y-full' : ''}`
        : `max-lg:sticky max-lg:top-0 max-lg:z-40 max-lg:bg-paper/95 max-lg:backdrop-blur-sm max-lg:transition-transform max-lg:duration-200 ${hidden ? 'max-lg:-translate-y-full' : ''}`,
    ]"
    ><div
      ref="row"
      :class="[
        'relative mx-auto flex items-center justify-between gap-4',
        sticky ? 'h-12' : 'py-2',
        width === 'prose'
          ? 'px-4 sm:px-6 max-w-[52rem]'
          : 'px-4 sm:px-6 lg:px-10 xl:px-16 max-w-[86rem]',
      ]"
      ><BackLink :back="back" :index-href="backIndexHref" /><span
        aria-hidden="true"
        :style="titleStyle"
        :class="[
          'pointer-events-none absolute top-1/2 -translate-y-1/2 truncate whitespace-nowrap text-token-sm text-ink-muted transition-opacity duration-fast',
          shown() ? 'opacity-100' : 'opacity-0',
        ]"
        >{{ currentTitle || h1Text }}</span
      ><div
        v-if="search"
        class="min-w-0 flex-1 px-4 sm:px-8"
        ><div class="max-w-xl"><VNodeOutlet :content="search" /></div></div
      ><span v-else class="flex-1" /><div class="flex items-center gap-2"
        ><button
          v-if="onLangChange"
          type="button"
          @click="onLangChange(lang === 'en' ? 'zh' : 'en')"
          class="text-token-xs text-ink-muted"
          >{{ lang === 'en' ? '中文' : 'EN' }}</button
        ><div
          :class="['transition-opacity duration-fast', shown() ? 'pointer-events-none opacity-0' : '']"
          :aria-hidden="shown() ? 'true' : undefined"
          :inert="shown() ? true : undefined"
          ><AppearanceMenu
          :lang="lang"
          :scale="scale"
          :on-scale-change="onScaleChange" /></div></div></div
  ></div>
</template>

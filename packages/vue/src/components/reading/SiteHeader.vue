<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
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
  home?: { href: string; label: string };
}>(),
  { sticky: true },
);
const hidden = ref(false),
  past = ref(false),
  h1Text = ref(''),
  titleStyle = ref<Record<string, string>>({}),
  row = ref<HTMLElement>(),
  tools = ref<HTMLElement>(),
  searchBox = ref<HTMLElement>(),
  homeEl = ref<any>(),
  route = useRoute();
// 浮出的篇名可點，捲回頁首（2026-11-17：首頁不傳 home，捲下去後頂列沒有任何可回上的入口）。
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
const shown = () => past.value && !!(props.currentTitle || h1Text.value);
// home 的 href 為絕對網址時用 a，否則交給 RouterLink，站在子路徑（base）下時才會帶上 base。
const isAbsolute = (href: string) => /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//');
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
  // 篇名右緣止於右側第一個看得見的控制項（search 欄內容或外觀鈕）左緣前 16px；控制項不再為篇名讓位
  // （2026-11-17：窄螢幕篇名不顯示，外觀鈕卻跟著淡出，頂列只剩空條）。
  const lefts: number[] = [];
  if (tools.value) lefts.push(tools.value.getBoundingClientRect().left);
  const slotRoot = searchBox.value?.firstElementChild;
  if (slotRoot) {
    const kids = [...slotRoot.children].filter((e) => e.getBoundingClientRect().width > 0);
    for (const e of kids.length ? kids : [slotRoot]) lefts.push(e.getBoundingClientRect().left);
  }
  const limit = lefts.length ? Math.min(...lefts) - 16 : host ? host.right - 16 : 0;
  // 傳了 home 時，篇名接在站名後面成「站名 › 篇名」，起點是站名的右緣，不對齊正文欄。
  const homeNode: Element | undefined = homeEl.value?.$el ?? homeEl.value;
  if (host && homeNode?.getBoundingClientRect) {
    const left = Math.max(0, homeNode.getBoundingClientRect().right - host.left + 6);
    titleStyle.value = {
      left: `${left}px`,
      maxWidth: `${Math.max(0, limit - host.left - left)}px`,
    };
  } else if (host && r.width > 0) {
    const left = Math.max(0, r.left - host.left);
    titleStyle.value = {
      left: `${left}px`,
      maxWidth: `${Math.max(0, Math.min(r.width, limit - host.left - left))}px`,
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
        ? `phenom-site-header--sticky bg-paper max-lg:sticky max-lg:top-0 max-lg:z-40 max-lg:transition-transform max-lg:duration-200 lg:sticky lg:top-0 lg:z-40 lg:border-b lg:border-line-soft ${hidden ? 'max-lg:-translate-y-full' : ''}`
        : `max-lg:sticky max-lg:top-0 max-lg:z-40 max-lg:bg-paper max-lg:transition-transform max-lg:duration-200 ${hidden ? 'max-lg:-translate-y-full' : ''}`,
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
      ><BackLink :back="back" :index-href="backIndexHref" /><component
        v-if="home"
        ref="homeEl"
        :is="isAbsolute(home.href) ? 'a' : RouterLink"
        v-bind="isAbsolute(home.href) ? { href: home.href } : { to: home.href }"
        class="phenom-site-header__home ml-3 block min-w-0 max-w-[45%] shrink truncate font-display text-token-sm font-medium leading-tight text-ink underline-offset-4 decoration-1 hover:underline focus-visible:underline sm:max-w-[16rem]"
        >{{ home.label }}</component
      ><button
        type="button"
        title="回到頁首"
        :tabindex="shown() ? 0 : -1"
        :aria-hidden="shown() ? undefined : 'true'"
        @click="toTop"
        :style="titleStyle"
        :class="[
          'phenom-site-header__title absolute top-1/2 max-lg:hidden -translate-y-1/2 truncate whitespace-nowrap text-left text-token-sm text-ink-muted transition-opacity duration-fast hover:text-ink',
          shown() ? 'opacity-100' : 'pointer-events-none opacity-0',
        ]"
        ><template v-if="home"><span class="mr-1.5 text-ink-faint">›</span></template
        >{{ currentTitle || h1Text }}</button
      ><div
        v-if="search"
        :class="['flex-1 px-4 sm:px-8', home ? 'min-w-fit' : 'min-w-0']"
        ><div ref="searchBox" class="max-w-xl"><VNodeOutlet :content="search" /></div></div
      ><span v-else class="flex-1" /><div ref="tools" class="relative z-10 flex items-center gap-2 bg-paper"
        ><button
          v-if="onLangChange"
          type="button"
          @click="onLangChange(lang === 'en' ? 'zh' : 'en')"
          class="text-token-xs text-ink-muted"
          >{{ lang === 'en' ? '中文' : 'EN' }}</button
        ><AppearanceMenu
          :lang="lang"
          :scale="scale"
          :on-scale-change="onScaleChange" /></div></div
  ></div>
</template>

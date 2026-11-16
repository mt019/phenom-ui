<script setup lang="ts">
import { RouterLink } from 'vue-router';
withDefaults(
  defineProps<{
    topics?: any[];
    articles?: any[];
    currentSlug?: string;
    homeHref: string;
    homeLabel: string;
    lang?: string;
  }>(),
  { topics: () => [], articles: () => [], lang: 'zh' },
);
// 回本站首頁的站名連結用正文墨、display 字，比下面的清單大一級，滑過加底線。
// 2026-11-16 以前是 accent 字大寫加字距的淡墨小字，站主指出讀起來像欄位說明、看不出能點。
// 具名插槽 icon 可放一個前置圖標。React 版 lab/ArticleLayout.jsx 的 ArticleNav 同一套 class。
</script>
<template>
  <nav :aria-label="homeLabel" class="text-token-xs"
    ><RouterLink
      :to="homeHref"
      class="group mb-4 flex w-fit max-w-full items-center gap-2 font-display text-token-sm font-medium leading-tight text-ink"
      ><span v-if="$slots.icon" class="shrink-0 text-ink-muted" aria-hidden="true"><slot name="icon" /></span
      ><span
        class="min-w-0 underline-offset-4 decoration-1 group-hover:underline group-focus-visible:underline"
        >{{ homeLabel }}</span
      ></RouterLink
    ><template v-for="t in topics" :key="t.id"
      ><div v-if="articles.some((a: any) => a.topic === t.id)" class="mb-5"
        ><p class="mb-1.5 text-ink-muted">{{
          lang === 'en' ? (t.en?.label ?? t.label) : t.label
        }}</p
        ><ul class="space-y-1 border-l border-line-soft"
          ><li v-for="a in articles.filter((a: any) => a.topic === t.id)" :key="a.slug"
            ><RouterLink
              :to="a.route"
              class="-ml-px block border-l-2 py-1 pl-3 leading-snug transition-colors duration-fast"
              :style="{
                borderColor: a.slug === currentSlug ? 'var(--c-accent)' : 'transparent',
                color: a.slug === currentSlug ? 'var(--c-ink)' : 'var(--c-ink-faint)',
              }"
              >{{ lang === 'en' ? (a.en?.title ?? a.title) : a.title }}</RouterLink
            ></li
          ></ul
        ></div
      ></template
    ></nav
  >
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useHeadings } from '../../composables/useHeadings';
import { useAnchorScroll } from '../../composables/anchorScroll.js';
import BackLink from './BackLink.vue';
import PageIdentity from './PageIdentity.vue';
import TableOfContents from './TableOfContents.vue';
import MobileRail from './MobileRail.vue';
import VNodeOutlet from './VNodeOutlet';
import Tabs from './Tabs.vue';
const props = withDefaults(
  defineProps<{
    scale?: number;
    back?: any;
    backIndexHref?: string;
    headerRight?: any;
    eyebrow?: string;
    eyebrowBack?: any;
    title?: string;
    titleClassName?: string;
    summary?: string;
    tabs?: any;
    leftRailTop?: any;
    tocLabel?: string;
    hideToc?: boolean;
    padX?: string;
    refreshKey?: any;
    children?: any;
  }>(),
  { tocLabel: '本頁區塊', padX: 'px-4 sm:px-6 lg:px-16 xl:px-24' },
);
const body = ref<HTMLElement>();
const { items, active } = useHeadings(body, () => props.refreshKey);
useAnchorScroll();
const show = computed(() => !props.hideToc && (items.value.length > 0 || props.leftRailTop));
const panels = computed(() =>
  show.value
    ? [
        {
          key: 'toc',
          side: 'right',
          label: props.tocLabel,
          content: h('div', null, [
            props.leftRailTop,
            h(TableOfContents, { label: props.tocLabel, items: items.value, active: active.value }),
          ]),
        },
      ]
    : [],
);
</script>
<template>
  <main class="min-h-screen bg-paper paper-texture text-ink" :style="{ '--reader-scale': scale }"
    ><header class="border-b border-line-soft"
      ><div :class="['mx-auto max-w-7xl py-7', padX]"
        ><div class="mb-4 flex items-center justify-between gap-4"
          ><BackLink :back="back" :index-href="backIndexHref" /><span class="flex-1" /><div
            v-if="headerRight"
            class="flex items-center gap-2"
            ><VNodeOutlet :content="headerRight" /></div></div
        ><div class="reader-scale"
          ><PageIdentity
            :eyebrow="eyebrow"
            :eyebrow-back="eyebrowBack"
            :title="title"
            :title-class-name="titleClassName"
            :summary="summary" /></div></div></header
    ><div v-if="tabs" class="sticky top-0 z-20 border-b border-line-soft bg-paper"
      ><div :class="['mx-auto max-w-7xl', padX]"
        ><div class="reader-scale flex"
          ><Tabs
            variant="dashboard"
            :label="tabs.label"
            :value="tabs.value"
            :on-change="tabs.onChange"
            :items="tabs.items" /></div></div></div
    ><div
      :class="[
        'mx-auto grid max-w-7xl gap-8 py-8 lg:gap-10',
        padX,
        panels.length ? 'pb-24 lg:pb-8' : '',
        !hideToc ? 'lg:grid-cols-[minmax(0,1fr)_13rem]' : '',
      ]"
      ><div ref="body" class="reader-scale min-w-0"
        ><VNodeOutlet :content="children"><slot /></VNodeOutlet></div
      ><aside v-if="show" class="hidden lg:block"
        ><div
          class="sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto border-l border-line-soft pb-10 pl-5"
          ><VNodeOutlet :content="leftRailTop" /><TableOfContents
            :label="tocLabel"
            :items="items"
            :active="active" /></div></aside></div
    ><MobileRail :panels="panels"
  /></main>
</template>

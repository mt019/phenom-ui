<script setup lang="ts">
import BackLink from './BackLink.vue';
import Eyebrow from './Eyebrow.vue';
import Tabs from './Tabs.vue';
import VNodeOutlet from './VNodeOutlet';
withDefaults(
  defineProps<{
    scale?: number;
    back?: any;
    backIndexHref?: string;
    headerRight?: any;
    eyebrow?: string;
    title?: string;
    onHome?: () => void;
    homeTitle?: string;
    nav?: any;
    rail?: any;
    padX?: string;
    children?: any;
  }>(),
  { padX: 'px-4 sm:px-6 lg:px-10 xl:px-16' },
);
</script>
<template>
  <main
    data-search-root
    class="min-h-screen bg-paper paper-texture text-ink"
    :style="{ '--reader-scale': scale }"
    ><div :class="['mx-auto max-w-7xl', padX]"
      ><div class="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10"
        ><aside
          class="contents lg:block lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:border-r lg:py-5 lg:pr-5"
          ><div
            class="flex items-center justify-between gap-2 pt-5 lg:flex-col lg:items-start lg:gap-3 lg:pt-0"
            ><BackLink :back="back" :index-href="backIndexHref" /><div
              v-if="headerRight"
              class="flex shrink-0 items-center gap-2"
              ><VNodeOutlet :content="headerRight" /></div></div
          ><component
            :is="onHome ? 'button' : 'div'"
            :type="onHome ? 'button' : undefined"
            @click="onHome?.()"
            :title="onHome ? homeTitle : undefined"
            :class="onHome ? 'group mt-4 block text-left' : 'mt-4'"
            ><Eyebrow v-if="eyebrow" class="mb-1">{{ eyebrow }}</Eyebrow
            ><h1
              class="font-display text-token-lg leading-tight text-ink transition-colors duration-fast group-hover:text-accent lg:text-token-xl"
              >{{ title }}</h1
            ></component
          ><nav
            v-if="nav"
            class="sticky top-0 z-20 mt-5 border-b border-line-soft bg-paper py-2 lg:static lg:z-auto lg:border-b-0 lg:bg-transparent lg:py-0"
            ><Tabs
              variant="rail"
              :label="nav.label"
              :value="nav.value"
              :on-change="nav.onChange"
              :items="nav.items" /></nav
          ><VNodeOutlet :content="rail" /></aside
        ><div class="reader-scale min-w-0 py-8"
          ><VNodeOutlet :content="children"><slot /></VNodeOutlet></div></div></div
  ></main>
</template>

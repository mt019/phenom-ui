<script setup lang="ts">
// Slots separate the site's content from its shared reading frame.
withDefaults(defineProps<{scale?:number;title:string;summary?:string;hideAside?:boolean}>(),{scale:1,hideAside:false});
</script>
<template>
  <div :style="{'--reader-scale':scale}" class="mx-auto max-w-[86rem] px-4 sm:px-6 lg:px-10 xl:px-16">
    <header v-if="$slots.toolbar" class="mb-6 flex min-h-10 items-center justify-between gap-4 py-2"><slot name="toolbar" /></header>
    <div :class="['grid grid-cols-[minmax(0,1fr)] gap-10 lg:gap-12',hideAside?'lg:grid-cols-[15rem_minmax(0,44rem)]':'lg:grid-cols-[15rem_minmax(0,44rem)_14rem]']">
      <aside class="hidden lg:block"><div class="sticky top-16 max-h-[calc(100vh-6rem)] overflow-y-auto border-r border-line-soft pr-5"><slot name="navigation" /></div></aside>
      <article class="reader-scale min-w-0">
        <header class="mb-8"><slot name="eyebrow" /><h1 class="font-display text-token-2xl font-bold leading-snug text-ink">{{ title }}</h1><p v-if="summary" class="mt-4 text-token-body leading-relaxed text-ink-muted">{{ summary }}</p><slot name="meta" /></header>
        <slot />
      </article>
      <aside v-if="!hideAside" class="hidden lg:block"><div class="sticky top-16"><slot name="aside" /></div></aside>
    </div>
  </div>
</template>

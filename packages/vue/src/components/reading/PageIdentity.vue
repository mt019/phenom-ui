<script setup lang="ts">
import { RouterLink } from 'vue-router';
defineProps<{
  eyebrow?: string;
  eyebrowBack?: any;
  title?: string;
  titleClassName?: string;
  summary?: string;
}>();
const shared =
  'flex flex-wrap items-center gap-x-[0.85em] gap-y-1 font-accent text-token-xs font-bold uppercase tracking-[0.26em] text-ink-muted mb-2';
</script>
<template>
  <component
    v-if="eyebrow"
    :is="eyebrowBack ? RouterLink : 'div'"
    :to="eyebrowBack?.href"
    :aria-label="eyebrowBack ? `回${eyebrowBack.label}` : undefined"
    :class="[
      shared,
      eyebrowBack ? 'group/eyebrow w-fit transition-colors duration-fast hover:text-accent' : '',
    ]"
    :style="{ fontSynthesis: 'none' }"
    ><template v-for="(token, i) in eyebrow.trim().split(/\s+/)" :key="i"
      ><span
        v-if="['·', '•', '・'].includes(token)"
        class="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60"
      /><span
        v-else
        :class="
          eyebrowBack
            ? 'underline decoration-line decoration-dotted decoration-1 underline-offset-[5px] transition-colors duration-fast group-hover/eyebrow:decoration-accent'
            : undefined
        "
        >{{ token }}</span
      ></template
    ></component
  ><h1
    v-if="title"
    :class="[titleClassName ?? 'font-display', 'text-token-2xl leading-tight sm:text-token-3xl']"
    >{{ title }}</h1
  ><p v-if="summary" class="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{{
    summary
  }}</p
  ><slot />
</template>

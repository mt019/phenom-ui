<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ArrowRight } from 'lucide-vue-next';
defineProps<{ to: string; title: string; count?: number | string; className?: string }>();
</script>
<template>
  <RouterLink
    :to="to"
    :class="[
      'group -mx-3 block rounded-token-md px-3 py-4 transition-colors duration-fast hover:bg-surface',
      className,
    ]"
    ><div class="flex items-baseline gap-2"
      ><span
        class="font-display text-token-lg text-ink transition-colors duration-fast group-hover:text-accent"
        >{{ title }}</span
      ><span v-if="count != null" class="font-accent text-token-xs tabular-nums text-ink-faint">{{
        count
      }}</span
      ><ArrowRight
        :size="16"
        class="shrink-0 self-center text-ink-faint transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-accent" /></div
    ><div v-if="$slots.default" class="mt-2 text-token-sm leading-relaxed text-ink-muted"
      ><slot /></div
  ></RouterLink>
</template>

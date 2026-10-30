<script setup lang="ts">
import { computed, useSlots } from 'vue';
const slots = useSlots();
const text = computed(
  () =>
    slots
      .default?.()
      .map((v) => (typeof v.children === 'string' ? v.children : ''))
      .join('') ?? '',
);
</script>
<template>
  <div
    style="font-synthesis: none"
    class="flex flex-wrap items-center gap-x-[0.85em] gap-y-1 font-accent text-token-xs font-bold uppercase tracking-[0.26em] text-ink-muted"
    ><template v-for="(token, i) in text.trim().split(/\s+/)" :key="i"
      ><span
        v-if="['·', '•', '・'].includes(token)"
        class="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60"
      /><span v-else>{{ token }}</span></template
    ></div
  >
</template>

<script setup lang="ts">
defineProps<{ label?: string; note?: string; className?: string }>();
</script>
<template>
  <div :class="className"
    ><div class="flex flex-wrap items-center gap-x-4 gap-y-3 border-y border-line py-3"
      ><span v-if="label" class="text-token-sm text-ink-muted">{{ label }}</span
      ><slot /></div
    ><p v-if="note" class="mt-3 text-token-sm tabular-nums text-ink-faint">{{ note }}</p></div
  >
</template>

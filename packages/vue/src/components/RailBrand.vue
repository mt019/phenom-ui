<script setup lang="ts">
import {RouterLink,type RouteLocationRaw} from 'vue-router';
defineProps<{title:string;subtitle?:string;to:RouteLocationRaw}>();
</script>
<template>
  <RouterLink :to="to" class="group mb-3.5 flex w-full items-center gap-3 border-b border-line-soft pb-3.5">
    <span v-if="$slots.icon" class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-ink text-paper"><slot name="icon" /></span>
    <span class="min-w-0">
      <strong class="block font-display text-token-body font-medium leading-tight text-ink group-hover:underline">{{ title }}</strong>
      <span v-if="subtitle" class="mt-0.5 block text-token-sm text-ink-muted">{{ subtitle }}</span>
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
defineProps<{ item: any; active: boolean; onSelect?: (id: any) => void }>();
const LEAF =
  'block border-l-2 py-1 pl-3 pr-2 text-token-xs leading-snug transition-colors duration-fast';
const ACTIVE = 'border-accent bg-accent-soft font-bold text-accent';
const IDLE = 'border-transparent text-ink-muted hover:border-line hover:text-accent';
</script>
<template>
  <li
    ><button
      v-if="onSelect"
      type="button"
      @click="onSelect(item.id)"
      :aria-current="active ? 'page' : undefined"
      :data-leaf-active="active ? '' : undefined"
      :class="[LEAF, active ? ACTIVE : IDLE, 'w-full text-left']"
      ><span class="flex items-baseline gap-2"
        ><span v-if="item.lead != null" class="w-7 shrink-0 tabular-nums text-ink-faint">{{
          item.lead
        }}</span
        ><span class="min-w-0 flex-1">{{ item.title }}</span
        ><span v-if="item.badge" class="shrink-0 text-accent">{{ item.badge }}</span></span
      ></button
    ><RouterLink
      v-else
      :to="item.href"
      :data-leaf-active="active ? '' : undefined"
      :title="item.hint || undefined"
      :class="[LEAF, active ? ACTIVE : IDLE]"
      ><span class="flex items-baseline gap-2"
        ><span v-if="item.lead != null" class="w-7 shrink-0 tabular-nums text-ink-faint">{{
          item.lead
        }}</span
        ><span class="min-w-0 flex-1">{{ item.title }}</span
        ><span v-if="item.badge" class="shrink-0 text-accent">{{ item.badge }}</span></span
      ></RouterLink
    ></li
  >
</template>

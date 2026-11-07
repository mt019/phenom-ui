<script setup lang="ts">
import { RouterLink } from 'vue-router';
defineProps<{ item: any; active: boolean; onSelect?: (id: any) => void }>();
// 連結版自己畫 <a>：RouterLink 判斷目前頁只比路徑不比 query，分頁與各篇全在同一路徑底下的站
// （guzhun 的 ?tab= 與 &text=）會讓每一條都帶 aria-current。目前頁以呼叫端算好的 active 為準。
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
    ><RouterLink v-else v-slot="{ href, navigate }" :to="item.href" custom
      ><a
        :href="href"
        @click="navigate"
        :aria-current="active ? 'page' : undefined"
        :data-leaf-active="active ? '' : undefined"
        :title="item.hint || undefined"
        :class="[LEAF, active ? ACTIVE : IDLE]"
        ><span class="flex items-baseline gap-2"
          ><span v-if="item.lead != null" class="w-7 shrink-0 tabular-nums text-ink-faint">{{
            item.lead
          }}</span
          ><span class="min-w-0 flex-1">{{ item.title }}</span
          ><span v-if="item.badge" class="shrink-0 text-accent">{{ item.badge }}</span></span
        ></a
      ></RouterLink
    ></li
  >
</template>

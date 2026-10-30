<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
const props = withDefaults(
  defineProps<{ label?: string; items: any[]; active?: string | null; metaIds?: string[] }>(),
  { label: '本頁目次', metaIds: () => ['notes', 'sources'] },
);
const root = ref<HTMLElement>();
watch(
  () => props.active,
  async () => {
    await nextTick();
    root.value
      ?.querySelector<HTMLElement>('[aria-current="location"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  },
);
</script>
<template>
  <nav v-if="items.length" ref="root" :aria-label="label" class="text-token-xs leading-relaxed"
    ><p class="mb-2 font-accent uppercase tracking-[0.12em] text-ink-faint">{{ label }}</p
    ><ul class="space-y-1.5 border-l border-line-soft"
      ><li
        v-for="(it, idx) in items"
        :key="it.id"
        :style="{
          paddingLeft: it.level >= 3 ? '24px' : '12px',
          ...(idx === items.findIndex((item: any) => metaIds.includes(item.id))
            ? { marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--c-line-soft)' }
            : {}),
        }"
        ><a
          :href="`#${it.id}`"
          :title="it.full"
          :aria-current="it.id === active ? 'location' : undefined"
          :class="[
            '-ml-px block border-l-2 py-0.5 pl-2 transition-colors duration-fast [line-break:strict] [text-wrap:pretty] line-clamp-2',
            it.level >= 3 ? 'text-[0.92em]' : '',
          ]"
          :style="{
            borderColor: it.id === active ? 'var(--c-accent)' : 'transparent',
            color:
              it.id === active
                ? 'var(--c-ink)'
                : it.level >= 3
                  ? 'var(--c-ink-faint)'
                  : 'var(--c-ink-muted)',
          }"
          >{{ it.text }}</a
        ></li
      ></ul
    ></nav
  >
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import { ChevronRight } from 'lucide-vue-next';
import SearchField from './SearchField.vue';
import BookTreeLeaf from './BookTreeLeaf.vue';
import VNodeOutlet from './VNodeOutlet';
import { buildBookTree, centerActiveLeaf, searchBookTree } from './bookTree.js';
/*
 * 一整本書的目次，放進 ArticleLayout 的 nav。items 由呼叫端攤平：
 * [{ id, title, href, group, subgroup?, lead?, badge?, hint? }]；lead 是每列左側的定值
 * （原書頁碼），badge 是少數狀態的標記。傳 onSelect（或 @select）時葉子是按鈕，
 * 否則是 RouterLink。
 */
const props = withDefaults(
  defineProps<{
    items: any[];
    activeId?: any;
    label?: string;
    searchPlaceholder?: string;
    header?: any;
    onSelect?: (id: any) => void;
  }>(),
  { label: '全書目次', searchPlaceholder: '搜尋篇名…' },
);
const query = ref(''),
  root = ref<HTMLElement>(),
  // 可展開的分組一律預設展開；這裡記的是讀者收起的部次。
  collapsed = shallowRef(new Set<string>());
const tree = computed(() => buildBookTree(props.items));
const hits = computed(() => searchBookTree(props.items, query.value));
function toggle(name: string) {
  const next = new Set(collapsed.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  collapsed.value = next;
}
const center = () => centerActiveLeaf(root.value);
onMounted(center);
watch(
  () => props.activeId,
  () => nextTick(center),
);
</script>
<template>
  <div ref="root"
    ><VNodeOutlet :content="header"><slot name="header" /></VNodeOutlet
    ><SearchField
      :value="query"
      :on-change="(v) => (query = v)"
      :placeholder="searchPlaceholder"
      class-name="w-full" /><nav :aria-label="label" class="mt-3"
      ><template v-if="hits"
        ><p class="px-2 pb-2 text-token-xs tabular-nums text-ink-faint">{{ hits.length }} 篇符合</p
        ><ul
          ><BookTreeLeaf
            v-for="it in hits"
            :key="it.id"
            :item="it"
            :active="it.id === activeId"
            :on-select="onSelect" /></ul></template
      ><template v-else
        ><section v-for="group in tree" :key="group.name" class="mb-1"
          ><button
            type="button"
            @click="toggle(group.name)"
            :aria-expanded="!collapsed.has(group.name)"
            class="flex w-full items-center gap-1.5 px-1 py-1.5 text-left text-token-sm font-bold text-ink transition-colors duration-fast hover:text-accent"
            ><ChevronRight
              :size="13"
              :class="[
                'shrink-0 text-ink-faint transition-transform duration-fast',
                collapsed.has(group.name) ? '' : 'rotate-90',
              ]"
            /><span class="min-w-0 flex-1">{{ group.name }}</span
            ><span class="shrink-0 text-token-xs font-normal tabular-nums text-ink-faint">{{
              group.count
            }}</span></button
          ><template v-if="!collapsed.has(group.name)"
            ><div v-for="(block, bi) in group.blocks" :key="block.label ?? `b${bi}`" class="mb-1"
              ><p v-if="block.label" class="px-1 pb-0.5 pl-5 pt-1 text-token-xs text-ink-faint">{{
                block.label
              }}</p
              ><ul class="pl-3"
                ><BookTreeLeaf
                  v-for="it in block.items"
                  :key="it.id"
                  :item="it"
                  :active="it.id === activeId"
                  :on-select="onSelect" /></ul></div></template></section></template></nav
  ></div>
</template>

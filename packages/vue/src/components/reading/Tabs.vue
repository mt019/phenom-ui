<script setup lang="ts">
import { computed, ref } from 'vue';
import VNodeOutlet from './VNodeOutlet';
const props = withDefaults(
  defineProps<{
    items: any[];
    value?: string;
    onChange: (value: string) => void;
    variant?: string;
    className?: string;
    label?: string;
  }>(),
  { variant: 'underline' },
);
const VARIANTS: Record<string, { list: string; item: string; on: string; off: string }> = {
  // Underline: the page's primary sections. Reads as a table of contents.
  underline: {
    list: 'flex flex-wrap gap-5 border-b border-line',
    item: 'shrink-0 -mb-px border-b-2 pb-2 pt-1 text-token-sm transition-colors duration-fast',
    on: 'border-accent text-ink',
    off: 'border-transparent text-ink-faint hover:text-ink-muted',
  },
  // Quiet: sub-sections inside a section, and switches inside a figure.
  quiet: {
    list: 'flex flex-wrap gap-1 pb-1',
    item: 'shrink-0 rounded-md px-2.5 py-1 text-token-xs transition-colors duration-fast',
    on: 'bg-accent-soft text-accent',
    off: 'text-ink-faint hover:bg-surface hover:text-ink-muted',
  },
  // Bar: a dark navigation strip under a dark page header. Pages with their own
  // chrome (a colored masthead) need the tab strip to belong to that masthead;
  // the underline variant assumes a paper background and goes invisible there.
  bar: {
    list: 'flex flex-wrap gap-5 bg-accent px-4',
    item: 'shrink-0 border-b-2 py-3 text-token-sm transition-colors duration-fast',
    on: 'border-paper text-paper',
    off: 'border-transparent text-paper/60 hover:text-paper',
  },
  // Pill: sub-tabs that need to read as buttons rather than as links.
  pill: {
    list: 'flex flex-wrap gap-1.5 pb-1',
    item: 'shrink-0 rounded-token-md border px-3 py-1.5 text-token-xs transition-colors duration-fast',
    on: 'border-accent bg-accent text-paper',
    off: 'border-line bg-surface-raised text-ink-muted hover:border-accent hover:text-accent',
  },
  // Dashboard: the primary sticky nav for a whole page's sections (each button
  // is a research line, not a content-kind bucket) — a segmented-control track
  // (bg-surface capsule, my-2 so it doesn't touch the sticky bar's own edges)
  // holding solid pill buttons with a filled active state. `underline`'s thin
  // border-bottom and faint inactive color read as weak for this job.
  // `inline-flex` (not `flex`) is deliberate: with few tabs, a full-width flex
  // row leaves the button group stranded on the left with a bare void to the
  // right of it under a full-width border — inline-flex sizes the track to its
  // buttons, so it reads as one self-contained control regardless of tab count.
  dashboard: {
    list: 'inline-flex max-w-full flex-wrap gap-1 rounded-token-lg bg-surface p-1 my-2',
    item: 'shrink-0 rounded-token-md px-3 py-2 text-token-sm font-semibold transition-colors duration-fast',
    on: 'bg-accent text-paper',
    off: 'text-ink-muted hover:bg-surface-raised hover:text-ink',
  },
  // Rail: RailLayout 左欄的檢視切換。窄屏是吸頂那一列（換行、不橫捲），lg 起變成左欄的
  // 直排格線，所以按鈕靠左對齊而不置中——文字起點要跟底下的左欄內容對齊。選中的用
  // accent-soft 底而不是實心 accent：這一欄整天都在畫面上，實心色塊在旁邊太吵。
  rail: {
    list: 'flex flex-wrap gap-1 lg:grid lg:gap-0.5',
    item: 'shrink-0 rounded-token-md px-2.5 py-1.5 text-left text-token-sm transition-colors duration-fast',
    on: 'bg-accent-soft font-semibold text-accent',
    off: 'text-ink-muted hover:text-ink',
  },
};

const variantStyle = computed(() => VARIANTS[props.variant] ?? VARIANTS.underline),
  root = ref<HTMLElement>();
function choose(id: string) {
  props.onChange(id);
}
function key(e: KeyboardEvent) {
  const buttons = Array.from(
    root.value?.querySelectorAll<HTMLButtonElement>('button[role="tab"]') ?? [],
  );
  const index = buttons.indexOf(e.target as HTMLButtonElement);
  if (index < 0) return;
  let next = index;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % buttons.length;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
    next = (index - 1 + buttons.length) % buttons.length;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = buttons.length - 1;
  else return;
  e.preventDefault();
  buttons[next]?.focus();
  choose(props.items[next].id ?? props.items[next].value);
}
</script>
<template>
  <div
    ref="root"
    role="tablist"
    :aria-label="label"
    :class="[variantStyle.list, className]"
    @keydown="key"
    ><button
      v-for="item in items"
      :key="item.id ?? item.value"
      role="tab"
      type="button"
      :aria-selected="(item.id ?? item.value) === value"
      @click="choose(item.id ?? item.value)"
      :class="[
        variantStyle.item,
        (item.id ?? item.value) === value ? variantStyle.on : variantStyle.off,
      ]"
      ><VNodeOutlet :content="item.label" /><span
        v-if="item.count != null"
        :class="[
          'ml-1.5',
          (item.id ?? item.value) === value && ['dashboard', 'pill', 'bar'].includes(variant)
            ? 'text-paper/80'
            : 'text-ink-muted',
        ]"
        >{{ item.count }}</span
      ></button
    ></div
  >
</template>

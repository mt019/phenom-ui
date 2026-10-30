<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { Dices, ExternalLink, X } from 'lucide-vue-next';
const props = defineProps<{
  src: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  roll?: { onReroll?: () => void; threads?: any[] } | null;
}>();
const threads = computed(() => (props.roll?.threads ?? []).filter(Boolean)),
  dialog = ref<HTMLElement>();
let cleanup = () => {};
onMounted(() => {
  const previous = document.body.style.overflow,
    focus = document.activeElement as HTMLElement;
  document.body.style.overflow = 'hidden';
  function key(e: KeyboardEvent) {
    if (e.key === 'Escape') props.onClose();
    else if (e.key === 'Tab') {
      const nodes = Array.from(
        dialog.value?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],iframe,[tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length);
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }
  window.addEventListener('keydown', key);
  dialog.value?.querySelector<HTMLElement>('button[aria-label="關閉"]')?.focus();
  cleanup = () => {
    window.removeEventListener('keydown', key);
    document.body.style.overflow = previous;
    if (focus?.isConnected) focus.focus();
  };
});
onBeforeUnmount(() => cleanup());
const control =
  'inline-flex items-center gap-1 rounded-token-md border border-line px-2 py-1 text-token-xs font-semibold text-ink-muted transition-colors duration-fast hover:border-accent hover:text-accent';
</script>
<template>
  <div
    class="fixed inset-0 z-50 flex flex-col bg-ink/70 px-3 pb-3 pt-2 sm:px-8 sm:pb-6 sm:pt-2"
    @click="onClose"
    ><div
      ref="dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      class="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-token-lg border border-line bg-paper shadow-xl"
      @click.stop
      ><div class="flex items-center gap-3 border-b border-line-soft px-4 py-1.5"
        ><div class="min-w-0 flex-1 truncate"
          ><span class="text-token-sm font-semibold text-ink">{{ title }}</span
          ><span v-if="subtitle" class="ml-2 text-token-xs text-ink-muted">{{
            subtitle
          }}</span></div
        ><div
          v-if="threads.length"
          class="hidden shrink-0 items-center gap-2.5 border-l border-line-soft pl-3 text-token-xs text-ink-muted lg:flex"
          ><button
            v-for="(t, i) in threads"
            :key="i"
            type="button"
            @click="t.run"
            class="whitespace-nowrap transition-colors duration-fast hover:text-accent"
            >{{ t.label }}</button
          ></div
        ><div class="flex shrink-0 items-center gap-1.5"
          ><button
            v-if="roll?.onReroll"
            type="button"
            @click="roll.onReroll"
            title="換一篇（隨機）"
            :class="control"
            ><Dices :size="12" />換一篇</button
          ><a :href="src" target="_blank" rel="noreferrer" title="新分頁開啟" :class="control"
            >新分頁<ExternalLink :size="12" /></a
          ><button
            type="button"
            @click="onClose"
            title="關閉（Esc）"
            aria-label="關閉"
            :class="control"
            >關閉<X :size="12" /></button></div></div
      ><div
        v-if="threads.length"
        class="flex items-center gap-3 overflow-x-auto border-b border-line-soft px-4 py-1.5 text-token-xs text-ink-muted lg:hidden"
        ><button
          v-for="(t, i) in threads"
          :key="i"
          type="button"
          @click="t.run"
          class="shrink-0 whitespace-nowrap transition-colors duration-fast hover:text-accent"
          >{{ t.label }}</button
        ></div
      ><iframe :title="title" :src="src" class="min-h-0 flex-1 bg-surface" /></div
  ></div>
</template>

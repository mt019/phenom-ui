<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue';
import { Palette } from 'lucide-vue-next';
import {
  PALETTES,
  TEXTURES,
  getSitePaletteId,
  setSitePalette,
  getSiteTextureId,
  setSiteTexture,
} from '../../../core/styles/palettes.js';
defineProps<{ lang?: string }>();
const open = ref(false),
  palette = ref(''),
  texture = ref(''),
  root = ref<HTMLElement>(),
  menu = ref<HTMLElement>();
const position = ref<CSSProperties>({});
let frame = 0;
function place() {
  if (!open.value || !root.value) return;
  const anchor = root.value.getBoundingClientRect(),
    gap = 8,
    width = Math.min(272, Math.max(0, window.innerWidth - gap * 2));
  const height = menu.value?.offsetHeight ?? 0;
  const left = Math.max(gap, Math.min(anchor.right - width, window.innerWidth - width - gap));
  const below = anchor.bottom + 6;
  const top =
    height && below + height > window.innerHeight - gap
      ? Math.max(gap, Math.min(anchor.top - height - 6, window.innerHeight - height - gap))
      : Math.max(gap, below);
  position.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    maxHeight: 'calc(100dvh - 16px)',
    overflowY: 'auto',
  };
}
function close(e: Event) {
  if (e instanceof KeyboardEvent) {
    if (e.key === 'Escape') open.value = false;
  } else if (!root.value?.contains(e.target as Node) && !menu.value?.contains(e.target as Node))
    open.value = false;
}
watch(open, async (value) => {
  cancelAnimationFrame(frame);
  if (!value) return;
  place();
  await nextTick();
  place();
  frame = requestAnimationFrame(place);
});
onMounted(() => {
  palette.value = getSitePaletteId();
  texture.value = getSiteTextureId();
  document.addEventListener('pointerdown', close);
  document.addEventListener('keydown', close);
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  document.removeEventListener('pointerdown', close);
  document.removeEventListener('keydown', close);
  window.removeEventListener('resize', place);
  window.removeEventListener('scroll', place, true);
});
function color(id: string) {
  setSitePalette(id);
  palette.value = id;
}
function paper(id: string) {
  setSiteTexture(id);
  texture.value = id;
}
</script>
<template>
  <div ref="root" class="relative"
    ><button
      type="button"
      @click="open = !open"
      :aria-expanded="open"
      aria-haspopup="true"
      class="inline-flex items-center gap-1.5 rounded-token-sm border border-line-soft px-2 py-1 text-token-xs text-ink-muted transition-colors duration-fast hover:border-line hover:text-ink"
      ><Palette :size="13" />{{ lang === 'en' ? 'Appearance' : '外觀' }}</button
    ><Teleport v-if="open" to="body"
      ><div
        ref="menu"
        :style="position"
        class="z-50 w-[17rem] rounded-token-md border border-line-soft bg-paper p-3 shadow-token-sm"
        role="menu"
        ><p class="mb-2 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">{{
          lang === 'en' ? 'Colour' : '色票'
        }}</p
        ><div class="mb-4 flex flex-wrap gap-1.5"
          ><button
            v-for="p in PALETTES"
            :key="p.id"
            type="button"
            @click="color(p.id)"
            :title="p.name"
            :aria-label="p.name"
            :aria-pressed="palette === p.id"
            class="h-6 w-6 rounded-full border transition-transform duration-fast hover:scale-110"
            :style="{
              backgroundColor: p.vars.accent,
              borderColor: palette === p.id ? 'var(--c-ink)' : 'var(--c-line-soft)',
              borderWidth: palette === p.id ? '2px' : '1px',
            }" /></div
        ><p class="mb-2 font-accent text-token-xs uppercase tracking-[0.12em] text-ink-faint">{{
          lang === 'en' ? 'Paper' : '紙紋'
        }}</p
        ><div class="flex flex-wrap gap-1.5"
          ><button
            v-for="t in TEXTURES"
            :key="t.id"
            type="button"
            @click="paper(t.id)"
            :title="t.story"
            :aria-pressed="texture === t.id"
            class="rounded-token-sm border px-2 py-1 text-token-xs transition-colors duration-fast"
            :style="{
              borderColor: texture === t.id ? 'var(--c-ink)' : 'var(--c-line-soft)',
              color: texture === t.id ? 'var(--c-ink)' : 'var(--c-ink-faint)',
            }"
            >{{ t.name }}</button
          ></div
        ></div
      ></Teleport
    ></div
  >
</template>

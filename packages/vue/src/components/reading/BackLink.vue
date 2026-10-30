<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
const props = defineProps<{
  back?: any;
  indexHref?: string;
  floating?: boolean;
  className?: string;
}>();
const router = useRouter(),
  revealed = ref(false);
let timer: ReturnType<typeof setTimeout>;
const link = computed(() =>
  props.back === undefined
    ? { href: 'https://phenomcanvas.com/', label: '', title: '回 Phenom Canvas' }
    : props.back,
);
const index = computed(
  () => props.indexHref ?? (props.back === undefined ? 'https://canvas.phenomcanvas.com/' : null),
);
// Absolute destinations retain browser navigation even when the origin matches.
// A router-local "/" means this application's home, while an absolute apex URL
// means the fleet home; passing the latter to router.push would prepend the base.
function isAbsolute(href: string) {
  return /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//');
}
function go(href: string) {
  if (isAbsolute(href)) {
    location.assign(href);
    return;
  }
  router.push(href);
}
function click(e: MouseEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.button !== 0 || e.detail === 0) return;
  if (window.matchMedia?.('(hover: none)').matches && !revealed.value) {
    e.preventDefault();
    revealed.value = true;
    return;
  }
  if (!index.value || index.value === link.value.href) return;
  e.preventDefault();
  clearTimeout(timer);
  if (e.detail >= 2) go(index.value);
  else timer = setTimeout(() => go(link.value.href), 260);
}
onBeforeUnmount(() => clearTimeout(timer));
</script>
<template>
  <span
    v-if="link"
    :class="
      floating ? 'group fixed left-1 top-1 z-50 block p-2' : 'group -m-1 block w-fit shrink-0 p-1'
    "
    ><component
      :is="isAbsolute(link.href) ? 'a' : RouterLink"
      :href="link.href"
      :to="link.href"
      :aria-label="link.title || (link.label ? `回${link.label}` : '回首頁')"
      @click="click"
      :class="[
        floating
          ? 'rounded-token-md px-1 text-token-xs text-ink-muted phenom-back-link--quiet transition duration-fast focus-visible:opacity-100 group-hover:opacity-100 hover:bg-paper hover:opacity-100 hover:text-[var(--backlink-accent,var(--c-accent))] focus-visible:bg-paper'
          : 'phenom-back-link--quiet text-token-sm text-ink-muted transition duration-fast group-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--backlink-accent,var(--c-accent))]',
        className,
        revealed ? 'phenom-back-link--revealed' : '',
      ]"
      >{{ link.label ? `← ${link.label}` : '←' }}</component
    ></span
  >
</template>

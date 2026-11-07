<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
const props = defineProps<{ title: string; subtitle?: string; to: RouteLocationRaw }>();
// 目前頁的判斷連 query 一起比：站首頁 /guzhun 與分頁 /guzhun?tab=… 路徑相同，
// RouterLink 只比路徑會把每個分頁都標成目前頁。
const route = useRoute(),
  router = useRouter();
const current = computed(() => router.resolve(props.to).fullPath === route.fullPath);
</script>
<template>
  <RouterLink v-slot="{ href, navigate }" :to="to" custom
    ><a
      :href="href"
      @click="navigate"
      :aria-current="current ? 'page' : undefined"
      class="group mb-3.5 flex w-full items-center gap-3 border-b border-line-soft pb-3.5"
    >
      <span
        v-if="$slots.icon"
        class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-ink text-paper"
        ><slot name="icon"
      /></span>
      <span class="min-w-0">
        <strong
          class="block font-display text-token-body font-medium leading-tight text-ink group-hover:underline"
          >{{ title }}</strong
        >
        <span v-if="subtitle" class="mt-0.5 block text-token-sm text-ink-muted">{{
          subtitle
        }}</span>
      </span>
    </a></RouterLink
  >
</template>

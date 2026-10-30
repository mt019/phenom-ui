<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Clock, RefreshCw, Tag } from 'lucide-vue-next';
withDefaults(
  defineProps<{
    publishedAt?: string;
    updatedAt?: string;
    readingMinutes?: number;
    tags?: string[];
    tagSlugs?: string[];
    tagBase?: string;
    lang?: string;
  }>(),
  { tags: () => [], tagSlugs: () => [], tagBase: '/statistics/tags', lang: 'zh' },
);
const tagClass =
  'rounded-token-sm border border-line-soft px-1.5 py-0.5 text-ink-muted transition-colors duration-fast hover:border-accent hover:text-accent';
</script>
<template>
  <div
    class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line-soft py-3 text-token-xs text-ink-faint"
    ><span v-if="publishedAt" class="inline-flex items-center gap-1.5"
      ><span class="font-accent">{{ publishedAt }}</span
      >{{ lang === 'en' ? 'published' : '發表' }}</span
    ><span v-if="updatedAt && updatedAt !== publishedAt" class="inline-flex items-center gap-1.5"
      ><RefreshCw :size="12" /><span class="font-accent">{{ updatedAt }}</span
      >{{ lang === 'en' ? 'updated' : '更新' }}</span
    ><span v-if="readingMinutes" class="inline-flex items-center gap-1.5"
      ><Clock :size="12" />{{
        lang === 'en' ? `${readingMinutes} min read` : `約 ${readingMinutes} 分鐘`
      }}</span
    ><span v-if="tags.length" class="inline-flex flex-wrap items-center gap-1.5"
      ><Tag :size="12" /><template v-for="(t, i) in tags" :key="t"
        ><RouterLink v-if="tagSlugs[i]" :to="`${tagBase}/${tagSlugs[i]}`" :class="tagClass">{{
          t
        }}</RouterLink
        ><span v-else :class="tagClass">{{ t }}</span></template
      ></span
    ><slot
  /></div>
</template>

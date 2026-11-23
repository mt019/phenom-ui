<script setup lang="ts">
import { RouterLink } from 'vue-router';
// 眉標連結是回站首頁的連結，照 React 版 Eyebrow 用 react-router 的 Link：畫成 <a>，不帶
// aria-current。直接用 RouterLink 會在路徑相同的每個分頁（/guzhun?tab=…）都標 aria-current="page"。
defineProps<{
  eyebrow?: string;
  eyebrowBack?: any;
  // 眉標前幾個詞是回站首頁的連結；未傳時整條是連結。其餘詞畫成純文字，包在 data-eyebrow-tail 裡，
  // 站點可在那幾個字上掛自己的事件（renwen 集頁的集號）。
  eyebrowLinkCount?: number;
  title?: string;
  titleClassName?: string;
  summary?: string;
}>();
const DOTS = ['·', '•', '・'];
const split = (s: string) => s.trim().split(/\s+/);
const shared =
  'flex flex-wrap items-center gap-x-[0.85em] gap-y-1 font-accent text-token-xs font-bold uppercase tracking-[0.26em] text-ink-muted mb-2';
</script>
<template>
  <div
    v-if="eyebrow && eyebrowBack && eyebrowLinkCount && eyebrowLinkCount < split(eyebrow).length"
    :class="shared"
    :style="{ fontSynthesis: 'none' }"
    ><RouterLink v-slot="{ href, navigate }" :to="eyebrowBack.href" custom
      ><a
        :href="href"
        @click="navigate"
        :aria-label="`回${eyebrowBack.label}`"
        class="group/eyebrow flex w-fit items-center gap-x-[0.85em] transition-colors duration-fast hover:text-accent"
        ><template v-for="(token, i) in split(eyebrow).slice(0, eyebrowLinkCount)" :key="i"
          ><span
            v-if="DOTS.includes(token)"
            class="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60"
          /><span
            v-else
            class="underline decoration-line decoration-dotted decoration-1 underline-offset-[5px] transition-colors duration-fast group-hover/eyebrow:decoration-accent"
            >{{ token }}</span
          ></template
        ></a
      ></RouterLink
    ><span data-eyebrow-tail class="contents"
      ><template v-for="(token, i) in split(eyebrow).slice(eyebrowLinkCount)" :key="i"
        ><span
          v-if="DOTS.includes(token)"
          class="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60"
        /><span v-else>{{ token }}</span></template
      ></span
    ></div
  ><RouterLink
    v-else-if="eyebrow && eyebrowBack"
    v-slot="{ href, navigate }"
    :to="eyebrowBack.href"
    custom
    ><a
      :href="href"
      @click="navigate"
      :aria-label="`回${eyebrowBack.label}`"
      :class="[shared, 'group/eyebrow w-fit transition-colors duration-fast hover:text-accent']"
      :style="{ fontSynthesis: 'none' }"
      ><template v-for="(token, i) in eyebrow.trim().split(/\s+/)" :key="i"
        ><span
          v-if="['·', '•', '・'].includes(token)"
          class="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60"
        /><span
          v-else
          class="underline decoration-line decoration-dotted decoration-1 underline-offset-[5px] transition-colors duration-fast group-hover/eyebrow:decoration-accent"
          >{{ token }}</span
        ></template
      ></a
    ></RouterLink
  ><div v-else-if="eyebrow" :class="shared" :style="{ fontSynthesis: 'none' }"
    ><template v-for="(token, i) in eyebrow.trim().split(/\s+/)" :key="i"
      ><span
        v-if="['·', '•', '・'].includes(token)"
        class="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60"
      /><span v-else>{{ token }}</span></template
    ></div
  ><h1
    v-if="title"
    :class="[titleClassName ?? 'font-display', 'text-token-2xl leading-tight sm:text-token-3xl']"
    >{{ title }}</h1
  ><p v-if="summary" class="mt-3 max-w-3xl text-token-sm leading-relaxed text-ink-muted">{{
    summary
  }}</p
  ><slot />
</template>

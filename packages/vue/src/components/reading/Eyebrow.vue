<script setup lang="ts">
import { Comment, Text, useSlots, type VNode } from 'vue';
import { RouterLink } from 'vue-router';
/*
 * 標題上面那條眉標。React 正本是 phenom-ui 根目錄 src/components/Eyebrow.jsx，四條理由寫在那裡：
 * 字重 700、空格要自己補、font-synthesis: none、變音字由同一字面覆蓋。
 *
 * 預設 slot 全是文字時按空白切詞，一詞一個 span，以 flex gap 撐詞距，單獨成詞的間隔號畫成圓點；
 * 含元素的 slot 原樣輸出，與 React 版對非字串 children 的處理相同。
 *
 * back（{ href, label }）有值時整條是回上層的連結：走 RouterLink 的 custom 插槽自畫 <a>，
 * 不帶 aria-current（理由同 PageIdentity）。底線畫在每個詞的 span 上，外層是 flex 容器，
 * text-decoration 不會傳進 flex item。
 */
const props = defineProps<{
  back?: { href: string; label: string } | null;
  className?: string;
}>();
const slots = useSlots();
const DOTS = ['·', '•', '・'];
const shared =
  'flex flex-wrap items-center gap-x-[0.85em] gap-y-1 font-accent text-token-xs font-bold uppercase tracking-[0.26em] text-ink-muted';
const linked =
  'underline decoration-line decoration-dotted decoration-1 underline-offset-[5px] transition-colors duration-fast group-hover/eyebrow:decoration-accent';

// 在 render 期間呼叫 slot；全是文字節點時回傳詞串，否則回傳 null 表示原樣輸出。
function tokens(): string[] | null {
  const nodes = (slots.default?.() ?? []).filter((v: VNode) => v.type !== Comment);
  if (!nodes.every((v: VNode) => v.type === Text || typeof v.children === 'string' && typeof v.type === 'symbol')) return null;
  return nodes.map((v: VNode) => String(v.children ?? '')).join('').trim().split(/\s+/).filter(Boolean);
}
</script>
<template>
  <RouterLink v-if="props.back" v-slot="{ href, navigate }" :to="props.back.href" custom
    ><a
      :href="href"
      @click="navigate"
      :aria-label="`回${props.back.label}`"
      :class="[shared, 'group/eyebrow w-fit transition-colors duration-fast hover:text-accent', className]"
      :style="{ fontSynthesis: 'none' }"
      ><template v-if="tokens()"
        ><template v-for="(token, i) in tokens()" :key="i"
          ><span
            v-if="DOTS.includes(token)"
            class="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60" /><span v-else :class="linked">{{
            token
          }}</span></template
        ></template
      ><slot v-else /></a
  ></RouterLink
  ><div v-else :class="[shared, className]" :style="{ fontSynthesis: 'none' }"
    ><template v-if="tokens()"
      ><template v-for="(token, i) in tokens()" :key="i"
        ><span
          v-if="DOTS.includes(token)"
          class="h-[3px] w-[3px] shrink-0 rounded-full bg-current opacity-60" /><span v-else>{{ token }}</span></template
      ></template
    ><slot v-else /></div
  >
</template>

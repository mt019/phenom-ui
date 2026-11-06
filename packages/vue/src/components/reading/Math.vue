<script setup lang="ts">
import { computed } from 'vue';
import 'katex/dist/katex.min.css';
import '../../../core/styles/katex.css';
import { renderFormula } from './mathRender.js';
/*
 * 元件裡寫的公式；display 為 true 時是區塊公式（div），否則是行內（span）。資料層字串裡
 * 夾著 $…$ 的，用 MathText。數學符號只經由 LaTeX 進入頁面，不直接鍵入 Unicode 數學字元。
 */
const props = withDefaults(defineProps<{ tex: string; display?: boolean; className?: string }>(), {
  display: false,
  className: '',
});
const html = computed(() => renderFormula(props.tex, props.display));
</script>
<template>
  <component :is="display ? 'div' : 'span'" :class="className" v-html="html" />
</template>

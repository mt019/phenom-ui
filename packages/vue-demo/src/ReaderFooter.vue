<script setup lang="ts">
import {FontSizeControl,useFontScale} from '@phenomcanvas/ui-vue';
const {scale,setScale}=useFontScale();
</script>
<template><footer class="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6 text-token-sm text-ink-muted"><span>閱讀字級</span><FontSizeControl :model-value="scale" @update:model-value="setScale" /></footer></template>

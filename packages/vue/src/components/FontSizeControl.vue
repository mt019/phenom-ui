<script setup lang="ts">
import {computed} from 'vue';
import {FONT_SCALES} from '../composables/useFontScale';
const scale=defineModel<number>({required:true});
const index=computed(()=>FONT_SCALES.findIndex(value=>value===scale.value));
const button='px-2 py-1 transition-colors duration-fast hover:text-ink disabled:opacity-40 disabled:hover:text-ink-muted';
function step(delta:number){scale.value=FONT_SCALES[Math.min(FONT_SCALES.length-1,Math.max(0,index.value+delta))];}
</script>
<template>
  <div class="inline-flex items-center rounded-token-sm border border-line-soft text-token-xs text-ink-muted transition-colors duration-fast hover:border-line" role="group" aria-label="Font size">
    <button type="button" :class="button" aria-label="Smaller text" :disabled="index <= 0" @click="step(-1)">A−</button>
    <button type="button" :class="[button,'min-w-[2.9rem] border-x border-line-soft text-center tabular-nums',scale===1?'':'text-ink']" aria-label="Reset text size" @click="scale=1">{{ Math.round(scale*100) }}%</button>
    <button type="button" :class="button" aria-label="Larger text" :disabled="index >= FONT_SCALES.length-1" @click="step(1)">A＋</button>
  </div>
</template>

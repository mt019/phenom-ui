<script setup lang="ts">
import {computed} from 'vue';import {RouterLink} from 'vue-router';
import {ReadingShell,FontSizeControl,RailBrand,useFontScale,useTabParams} from '@phenomcanvas/ui-vue';import ReaderFooter from './ReaderFooter.vue';
const {scale,setScale}=useFontScale();
const {values,setValues}=useTabParams({tab:'reading',view:'all'});
const reading=computed(()=>values.value.tab==='reading');
const title=computed(()=>reading.value?'留一點閱讀的空間':'篇目索引');
const entries=[{id:'space',title:'留一點閱讀的空間'},{id:'rhythm',title:'文字與節奏'},{id:'return',title:'回到讀過的地方'}];
const query=computed(()=>entries.filter(entry=>values.value.view==='all'||entry.id==='space'));
</script>
<template>
  <div class="min-h-screen bg-paper py-6 text-ink">
    <ReadingShell :title="title" :scale="scale" summary="文字先有清楚的位置，閱讀才有自己的節奏。">
      <template #toolbar><RouterLink to="/" class="font-display text-token-sm text-ink-muted">Phenom</RouterLink><FontSizeControl :model-value="scale" @update:model-value="setScale" /></template>
      <template #navigation><RailBrand to="/" title="閱讀預覽" subtitle="Phenom"><template #icon><span aria-hidden="true">P</span></template></RailBrand><nav aria-label="站內導覽" class="space-y-2 text-token-sm"><RouterLink to="/" class="block text-ink-muted">閱讀</RouterLink><RouterLink :to="{query:{tab:'index'}}" class="block text-ink-muted">篇目索引</RouterLink></nav></template>
      <template #eyebrow><p class="mb-2 font-accent text-token-xs tracking-[0.18em] text-ink-faint">PHENOM</p></template>
      <nav aria-label="閱讀分頁" class="mb-8 flex gap-5 border-b border-line text-token-sm"><button :aria-pressed="reading" :class="['border-b-2 pb-2',reading?'border-accent text-accent':'border-transparent text-ink-muted']" @click="setValues({tab:'reading',view:'all'})">閱讀</button><button :aria-pressed="!reading" :class="['border-b-2 pb-2',!reading?'border-accent text-accent':'border-transparent text-ink-muted']" @click="setValues({tab:'index',view:'all'})">索引</button></nav>
      <div v-if="reading" class="prose-body text-token-body leading-[1.85]">
        <section id="space"><h2 class="font-serif text-token-lg font-bold">留白</h2><p class="mt-4">翻開一頁，先看見標題，再慢慢讀進正文。字級可以調整，兩側的導覽仍留在熟悉的位置。</p><p class="mt-6">篇目與正文各有自己的位置。讀到一半想找另一篇，仍能知道自己從哪裡來，也能回到原來的頁面。</p></section>
        <section id="rhythm" class="mt-10"><h2 class="font-serif text-token-lg font-bold">節奏</h2><p class="mt-4">段落之間留一點空間，讓意思接得起來。畫面不必熱鬧，文字本身就有足夠的層次。</p></section>
        <section id="return" class="mt-10"><h2 class="font-serif text-token-lg font-bold">返回</h2><p class="mt-4">索引是一條回去的路。讀者可以切換篇目，再用返回鍵回到剛才選擇的內容。</p></section>
      </div>
      <section v-else aria-label="篇目清單"><button class="mb-5 border-b border-line text-token-sm text-accent" @click="setValues({view:values.view==='all'?'selected':'all'})">{{ values.view==='all'?'只看選篇':'全部篇目' }}</button><ul class="divide-y divide-line-soft border-y border-line"><li v-for="entry in query" :key="entry.id" class="py-4"><RouterLink :to="{query:{},hash:'#'+entry.id}" class="text-token-body text-accent">{{ entry.title }}</RouterLink></li></ul></section>
      <ReaderFooter />
      <template #aside><nav aria-label="本頁目次" class="space-y-2 border-l border-line-soft pl-4 text-token-sm text-ink-muted"><p class="mb-3 font-bold text-ink">本頁目次</p><a v-for="entry in entries" :key="entry.id" :href="'#'+entry.id" class="block">{{ entry.title }}</a></nav></template>
    </ReadingShell>
  </div>
</template>

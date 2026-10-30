<script setup lang="ts">
import { onMounted, watch } from 'vue';
import PageIdentity from './PageIdentity.vue';
import BackLink from './BackLink.vue';
import VNodeOutlet from './VNodeOutlet';
const props = withDefaults(
  defineProps<{
    title?: string;
    eyebrow?: string;
    eyebrowBack?: any;
    width?: string;
    controls?: any;
    fontScale?: number;
    manageDocumentTitle?: boolean;
    back?: any;
    backIndexHref?: string;
    children?: any;
  }>(),
  { width: 'prose', manageDocumentTitle: true },
);
function updateTitle() {
  if (props.manageDocumentTitle && props.title) document.title = props.title;
}
onMounted(updateTitle);
watch(() => [props.title, props.manageDocumentTitle], updateTitle);
</script>
<template>
  <main
    class="min-h-screen bg-paper paper-texture text-ink"
    :style="fontScale != null ? { '--reader-scale': fontScale } : undefined"
  >
    <div
      :class="[
        'mx-auto py-10',
        width === 'wide' ? 'px-4 sm:px-6 lg:px-10 xl:px-16 max-w-6xl' : 'px-4 sm:px-6 max-w-3xl',
      ]"
    >
      <div class="mb-4 flex items-center justify-between gap-4">
        <BackLink :back="back" :index-href="backIndexHref" /><span class="flex-1" />
        <div v-if="controls" class="flex items-center gap-2"
          ><VNodeOutlet :content="controls"
        /></div>
      </div>
      <div :class="['reader-scale', width === 'prose' ? 'prose-scaled' : '']">
        <header class="mb-8"
          ><PageIdentity :eyebrow="eyebrow" :eyebrow-back="eyebrowBack" :title="title"
        /></header>
        <VNodeOutlet :content="children"><slot /></VNodeOutlet>
      </div>
    </div>
  </main>
</template>

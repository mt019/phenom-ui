<script setup lang="ts">
import AccordionItem from './AccordionItem.vue';
import VNodeOutlet from './VNodeOutlet';
defineProps<{
  items: any[];
  isOpen: (id: any) => boolean;
  onToggle: (id: any) => void;
  className?: string;
}>();
</script>
<template>
  <div :class="className"
    ><AccordionItem
      v-for="item in items"
      :key="item.id"
      :id="item.id"
      :title="item.title"
      :meta="item.meta"
      :is-open="isOpen(item.id)"
      :on-toggle="onToggle"
      ><VNodeOutlet
        :content="typeof item.render === 'function' ? item.render() : item.render" /></AccordionItem
  ></div>
</template>

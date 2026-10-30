<script setup lang="ts">
import {computed,ref,useAttrs} from 'vue';import {Search,X} from 'lucide-vue-next';
defineOptions({inheritAttrs:false});
const props=withDefaults(defineProps<{value?:string;onChange:(value:string)=>void;placeholder?:string;className?:string;ariaLabel?:string}>(),{value:'',placeholder:'搜尋…',className:'max-w-md'});
const input=ref<HTMLInputElement>(),attrs=useAttrs();
const accessibleLabel=computed(()=>props.ariaLabel??(typeof attrs['aria-label']==='string'?attrs['aria-label']:props.placeholder));
</script>
<template><div :class="['relative min-w-0',className,$attrs.class]"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"/><input ref="input" v-bind="Object.fromEntries(Object.entries($attrs).filter(([key])=>key!=='class'))" type="search" :value="value" @input="onChange(($event.target as HTMLInputElement).value)" :placeholder="placeholder" :aria-label="accessibleLabel" class="w-full rounded-token-md border border-line bg-surface-raised py-2 pl-9 pr-9 text-token-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"/><button v-if="value" type="button" @click="onChange('');input?.focus()" aria-label="清除搜尋" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><X :size="14"/></button></div></template>

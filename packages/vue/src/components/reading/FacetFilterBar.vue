<script setup lang="ts">
import {computed} from 'vue';

type FacetValue=string|number;
type Facet={key:string;label:string;values:FacetValue[];counts?:Record<string,number>};
const props=withDefaults(defineProps<{
  facets:Facet[];
  sel:Record<string,ReadonlySet<FacetValue>|undefined>;
  onToggle:(key:string,value:any)=>void;
  onClear:(key:string)=>void;
  onClearAll:()=>void;
  clearLabel?:string;
  clearAllLabel?:string;
}>(),{clearLabel:'清除',clearAllLabel:'清除全部篩選'});
const anyActive=computed(()=>props.facets.some(f=>(props.sel[f.key]?.size??0)>0));
</script>

<template>
  <div class="space-y-2">
    <div v-for="facet in facets" :key="facet.key" class="flex flex-wrap items-baseline gap-1.5">
      <span class="mr-1 w-8 shrink-0 text-token-xs text-ink-faint sm:w-10">{{facet.label}}</span>
      <button
        v-for="value in facet.values" :key="value" type="button"
        @click="onToggle(facet.key,value)"
        :aria-pressed="Boolean(sel[facet.key]?.size&&sel[facet.key]?.has(value))"
        :class="['rounded-token-md border px-2 py-0.5 text-token-xs transition-colors duration-fast',
          sel[facet.key]?.size&&sel[facet.key]?.has(value)
            ?'border-accent bg-accent-soft text-accent'
            :'border-line text-ink-faint hover:border-accent hover:text-accent']"
      >{{value}}<span v-if="facet.counts?.[value]!=null" class="ml-1 tabular-nums opacity-70">{{facet.counts[value]}}</span></button>
      <button
        v-if="sel[facet.key]?.size" type="button" @click="onClear(facet.key)"
        class="ml-0.5 text-token-xs text-ink-faint underline decoration-line underline-offset-2 transition-colors duration-fast hover:text-accent"
      >{{clearLabel}}</button>
    </div>
    <button
      v-if="anyActive" type="button" @click="onClearAll"
      class="text-token-xs text-ink-muted underline decoration-line underline-offset-2 transition-colors duration-fast hover:text-accent"
    >{{clearAllLabel}}</button>
  </div>
</template>

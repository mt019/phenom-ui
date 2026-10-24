import {computed,toValue,type MaybeRefOrGetter} from 'vue';
import {useRoute,useRouter,type LocationQueryRaw} from 'vue-router';
export function useTabParams<T extends Record<string,string>>(defaults:MaybeRefOrGetter<T>){
  const route=useRoute(),router=useRouter();
  const values=computed(()=>Object.fromEntries(Object.entries(toValue(defaults)).map(([key,fallback])=>{
    const value=route.query[key];return [key,(Array.isArray(value)?value[0]:value)??fallback];
  })) as T);
  async function setValues(patch:Partial<T>,{scroll='preserve',replace=false}:{scroll?:'preserve'|'top';replace?:boolean}={}){
    // Read the current route at write time; one patch changes every dimension atomically.
    const query:LocationQueryRaw={...route.query},fallbacks=toValue(defaults);
    for(const [key,next] of Object.entries(patch)){
      if(next===undefined||next===fallbacks[key])delete query[key];else query[key]=next;
    }
    const failure=await router[replace?'replace':'push']({query,hash:route.hash});
    if(!failure&&scroll==='top'&&typeof window!=='undefined')window.scrollTo({top:0});
    return failure;
  }
  return {values,setValues};
}

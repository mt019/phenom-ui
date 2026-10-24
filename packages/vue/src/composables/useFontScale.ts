import {onMounted,onScopeDispose,readonly,ref} from 'vue';
export const FONT_SCALE_STORAGE_KEY='canvaslab:fontScale';
export const FONT_SCALES=[0.85,0.925,1,1.1,1.25,1.4,1.6] as const;
const eventName='phenom:font-scale';
const valid=(value:number)=>FONT_SCALES.some(scale=>scale===value);
export function useFontScale(){
  // Keep SSR and the first hydration frame deterministic. Restore only on mount.
  const scale=ref(1),ready=ref(false);
  const restore=()=>{try{const saved=Number(window.localStorage.getItem(FONT_SCALE_STORAGE_KEY));scale.value=valid(saved)?saved:1;}catch{/* Storage may be unavailable. */}};
  const storage=(event:StorageEvent)=>{if(event.key===FONT_SCALE_STORAGE_KEY||event.key===null)restore();};
  const changed=(event:Event)=>{const value=(event as CustomEvent<number>).detail;if(valid(value))scale.value=value;};
  const setScale=(value:number)=>{
    if(!valid(value))return;
    scale.value=value;
    if(!ready.value)return;
    try{window.localStorage.setItem(FONT_SCALE_STORAGE_KEY,String(value));}catch{/* UI remains usable. */}
    window.dispatchEvent(new CustomEvent(eventName,{detail:value}));
  };
  onMounted(()=>{restore();ready.value=true;window.addEventListener('storage',storage);window.addEventListener(eventName,changed);});
  onScopeDispose(()=>{if(typeof window==='undefined')return;window.removeEventListener('storage',storage);window.removeEventListener(eventName,changed);});
  return {scale:readonly(scale),ready:readonly(ready),setScale};
}

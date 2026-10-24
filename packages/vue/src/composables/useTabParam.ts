import {computed} from 'vue';
import {useTabParams} from './useTabParams';
export function useTabParam(name:string,fallback=''){
 const {values,setValues}=useTabParams({[name]:fallback});
 const value=computed(()=>values.value[name]);
 const setValue=(next:string)=>setValues({[name]:next});
 return Object.assign([value,setValue] as const,{value,setValue});
}

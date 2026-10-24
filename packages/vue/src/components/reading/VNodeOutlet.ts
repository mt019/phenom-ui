import {cloneVNode,defineComponent,isVNode,type VNode} from 'vue';

/** A supplied tree may be shown in a desktop rail and a mobile drawer at once.
 * Each outlet owns its VNodes: sharing the mounted instance can move or discard
 * the other outlet's subtree during patching.
 */
function copy(content:any):any {
  if(Array.isArray(content))return content.map(copy);
  if(!isVNode(content))return content;
  const node=cloneVNode(content);
  if(Array.isArray(node.children))node.children=node.children.map(copy) as VNode[];
  return node;
}
export default defineComponent({
  name:'VNodeOutlet',props:['content'],
  setup(props,{slots}){return ()=>copy(props.content??slots.default?.()??null);},
});

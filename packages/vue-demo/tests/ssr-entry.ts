import {createSSRApp,h} from 'vue';import {renderToString} from '@vue/server-renderer';import {useFontScale} from '@phenomcanvas/ui-vue';
export async function renderScale(){return renderToString(createSSRApp({setup(){const {scale}=useFontScale();return()=>h('output',String(scale.value));}}));}

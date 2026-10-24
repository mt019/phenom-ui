import {defineConfig} from 'vite';import vue from '@vitejs/plugin-vue';
export default defineConfig({base:'/vue-ui/',plugins:[vue()],ssr:{noExternal:['@phenomcanvas/ui-vue']},build:{target:'es2022'}});

// 只改格式時用：前後各建一次，比對 OUT 底下的 ui-vue.js 與 ui-vue.css 是否逐位元組相同。
// 本套件不帶 vite 與 plugin-vue，PLUGIN_VUE 指向某個消費站 node_modules 裡的 plugin-vue。
// 例：在消費站目錄下
//   PLUGIN_VUE=$PWD/node_modules/@vitejs/plugin-vue/dist/index.mjs OUT=/tmp/before \
//     node node_modules/vite/bin/vite.js build --config <本檔絕對路徑>
// 先在 packages/vue 跑 node scripts/stage-core.mjs，index.ts 引用 core/。
import { fileURLToPath } from 'node:url';

const { default: vue } = await import(process.env.PLUGIN_VUE);
const root = fileURLToPath(new URL('..', import.meta.url));

export default {
  root,
  logLevel: 'warn',
  plugins: [vue()],
  build: {
    outDir: process.env.OUT,
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    lib: { entry: root + 'src/index.ts', formats: ['es'], fileName: 'ui-vue' },
    rollupOptions: {
      external: (id) => /^(vue|vue-router|lucide-vue-next|katex)(\/|$)/.test(id),
    },
  },
};

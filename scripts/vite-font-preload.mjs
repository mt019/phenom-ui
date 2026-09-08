// 給走跨 origin 字型的站在 index.html 注入 <link rel="preload">。
//
// 字型 URL 是內容定址（v1/<sha256>/fonts/），字型一換 URL 就換；preload 寫死在各站的
// index.html 會在換版時安靜過期，所以由建置從 fonts/external-manifest.json 讀當下的 URL
// 注入。跨 origin 的字型請求一律要帶 crossorigin，漏掉的話瀏覽器把 preload 那一次當成
// 不同憑證模式的請求，字型會抓兩次。
//
// 預設只 preload 內文常用面（HuiwenMincho-core-subset）：它是首屏中文的主體；
// ext 面與 Chiron 靠 unicode-range 按需觸發，preload 它們等於把省下的又付回去。
//
// 用法：
//   import fontPreload from '@phenomcanvas/ui/scripts/vite-font-preload.mjs';
//   plugins: [react(), fontPreload()]

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'fonts/external-manifest.json');

export default function fontPreload({ files = ['HuiwenMincho-core-subset.woff2'] } = {}) {
  return {
    name: 'phenom-font-preload',
    async transformIndexHtml() {
      const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
      if (!manifest.origin) {
        throw new Error('external-manifest.json 沒有 origin 欄位：這版套件的字型還是根相對路徑，preload 無 URL 可注入');
      }
      return files.map((source) => {
        const entry = manifest.files.find((item) => item.source === source);
        if (!entry) throw new Error(`external-manifest.json 沒有 ${source}`);
        return {
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: true, href: entry.url },
          injectTo: 'head',
        };
      });
    },
  };
}

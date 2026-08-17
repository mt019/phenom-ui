// 引 styles-external-fonts.css 的站要掛的 vite plugin。
//
// 那份 CSS 的 url() 是絕對路徑 /assets/fonts/<檔名>.<雜湊>.woff2，vite 不處理絕對路徑，
// 所以字型不會進本站的產物——這正是要的效果，但也表示開發伺服器與 preview 上沒有人供應它們，
// 不補的話本機看到的是系統明體。middleware 那一段就是補這件事。
//
// emit: true 的站另外把字型寫進自己的產物（同一個 origin 上只有底座該開這個開關）。
//
// 用法：
//   import externalFonts from '@phenomcanvas/ui/scripts/vite-external-fonts.mjs';
//   plugins: [react(), externalFonts()]              // 引用端
//   plugins: [react(), externalFonts({ emit: true })] // 供應端（底座）

import { createReadStream } from 'node:fs';
import { mkdir, readFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONT_DIR = path.join(ROOT, 'fonts');

async function loadManifest() {
  const raw = await readFile(path.join(FONT_DIR, 'external-manifest.json'), 'utf8');
  return JSON.parse(raw);
}

export default function externalFonts({ emit = false } = {}) {
  let manifest;
  let outDir = 'dist';

  const serve = (server) => {
    server.middlewares.use((req, res, next) => {
      const requested = (req.url || '').split('?')[0];
      const entry = manifest.files.find((item) => requested.endsWith(`/${item.hashed}`));
      if (!entry || !requested.startsWith(manifest.base)) return next();
      res.setHeader('Content-Type', 'font/woff2');
      res.setHeader('Cache-Control', 'no-store');
      createReadStream(path.join(FONT_DIR, entry.source)).pipe(res);
    });
  };

  return {
    name: 'phenom-external-fonts',
    async configResolved(config) {
      manifest = await loadManifest();
      outDir = config.build.outDir;
    },
    configureServer: serve,
    configurePreviewServer: serve,
    async writeBundle() {
      if (!emit) return;
      // SSR 那一趟也會呼叫，寫進 .ssr 沒有意義；只在真正的產物目錄寫一次。
      const target = path.resolve(outDir, manifest.base.replace(/^\//, ''));
      if (path.basename(outDir).startsWith('.')) return;
      await mkdir(target, { recursive: true });
      for (const entry of manifest.files) {
        await copyFile(path.join(FONT_DIR, entry.source), path.join(target, entry.hashed));
      }
    },
  };
}

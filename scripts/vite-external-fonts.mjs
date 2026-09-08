// 引 styles-external-fonts.css 的站沿用的 vite plugin。
//
// 2026-09-08 起 fonts-external.css 的 url() 是 assets.phenomcanvas.com 上的絕對 URL，
// 開發伺服器與產物都直接向該 origin 抓，這支不再需要做任何事；保留檔案只為了讓
// 還掛著它的 vite.config 不必同輪改。manifest 沒有 origin 欄位時（消費端裝的是
// 2026-09-08 以前的版本，url 還是根相對的 /assets/fonts/）維持舊行為：
// middleware 在開發伺服器供應字型、emit: true 的底座把字型寫進自己的產物。
//
// 用法（兩種版本相同）：
//   import externalFonts from '@phenomcanvas/ui/scripts/vite-external-fonts.mjs';
//   plugins: [react(), externalFonts()]

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
  const crossOrigin = () => Boolean(manifest?.origin);

  const serve = (server) => {
    server.middlewares.use((req, res, next) => {
      if (crossOrigin()) return next();
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
      if (crossOrigin()) {
        config.logger.info(`[phenom-external-fonts] 字型由 ${manifest.origin} 供應，本地供應與 emit 均跳過。`);
      }
    },
    configureServer: serve,
    configurePreviewServer: serve,
    async writeBundle() {
      if (!emit || crossOrigin()) return;
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

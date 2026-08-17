// fonts-external.css 與 fonts/external-manifest.json 是產生出來的，這支檢查它們與
// fonts-local.css ＋ fonts/*.woff2 的現況一致。
//
// 不一致的長相：改了字型檔卻沒重跑產生器，於是 manifest 裡的雜湊指向舊內容，底座供應的檔名
// 與各站 CSS 要的檔名對不上——請求 404、字型退回系統明體，而建置全綠。

import { readCommitted, buildExternalFonts, serializeManifest } from './build-external-fonts.mjs';

const built = await buildExternalFonts();
const committed = await readCommitted();

if (committed.css !== built.css) {
  throw new Error('src/fonts-external.css 與 fonts-local.css 不同步，跑 `node scripts/build-external-fonts.mjs`');
}
if (committed.manifest !== serializeManifest(built.manifest)) {
  throw new Error('fonts/external-manifest.json 與 fonts/*.woff2 不同步，跑 `node scripts/build-external-fonts.mjs`');
}

console.log(`external font delivery in sync: ${built.manifest.files.length} files`);

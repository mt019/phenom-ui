// 由 src/fonts-local.css 產生 src/fonts-external.css 與 fonts/external-manifest.json。
//
// 兩份 @font-face 的差別只有 url()：本地那份是套件相對路徑，交給 consumer 的 bundler 打包；
// 外部那份寫共用資產 origin 上的絕對 URL（origin 讀 fonts/external-origin.json，不寫死在這裡）。
// unicode-range、宣告順序、font-display 這些都從本地那份原樣抄過來——宣告順序決定常用面與
// 其餘面哪一個優先（見 fonts-local.css 的註解），兩份不一致就會有一個站的字型行為與別站不同。
//
// URL 的路徑照 phenom-ops 那支 public-assets Worker 的內容定址規則組：
// v1/<sha256 64 碼>/fonts/<原檔名>。內容進了路徑，供應端才能給一年期 immutable；
// 字型改了 URL 就變，讀者不必回頭問。上傳由 phenom-ops 的 upload-public-fonts.mjs
// 讀這份 manifest 做，兩邊共用同一份 key。
//
// 2026-09-08 以前這份產的是根相對路徑 /assets/fonts/<檔名>.<hash8>.woff2，供 studies
// 底座同 origin 供應；換成絕對 URL 之後，vite-external-fonts.mjs 的本地供應與 emit 都
// 不再需要（該檔自己會偵測並跳過）。
//
// 這支是產生器，不是檢查。改完字型或改完 fonts-local.css 就跑一次
// `node scripts/build-external-fonts.mjs`；有沒有跑由 validate-external-fonts.mjs 負責報。

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ORIGIN_CONFIG = path.join(ROOT, 'fonts/external-origin.json');
const LOCAL_CSS = path.join(ROOT, 'src/fonts-local.css');
const EXTERNAL_CSS = path.join(ROOT, 'src/fonts-external.css');
const MANIFEST = path.join(ROOT, 'fonts/external-manifest.json');

const URL_RE = /url\('\.\.\/fonts\/([A-Za-z0-9._-]+\.woff2)'\)/g;

/** 檔案內容的 sha256（hex 64 碼），與 Worker 的 key 規則一致。 */
export function sha256Of(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readOrigin() {
  const { origin } = JSON.parse(await readFile(ORIGIN_CONFIG, 'utf8'));
  if (!/^https:\/\/[a-z0-9.-]+$/.test(origin ?? '')) {
    throw new Error(`fonts/external-origin.json 的 origin 不合法：${origin}（要 https://主機名，結尾不帶斜線）`);
  }
  return origin;
}

/** 讀 fonts-local.css，回傳外部版的 CSS 與 manifest（不寫檔，檢查與產生共用）。 */
export async function buildExternalFonts() {
  const origin = await readOrigin();
  const local = await readFile(LOCAL_CSS, 'utf8');
  const names = [...new Set([...local.matchAll(URL_RE)].map((match) => match[1]))];
  if (names.length === 0) throw new Error('fonts-local.css 沒有任何 ../fonts/*.woff2 引用');

  const entries = [];
  for (const name of names) {
    const bytes = await readFile(path.join(ROOT, 'fonts', name));
    const sha256 = sha256Of(bytes);
    const key = `v1/${sha256}/fonts/${name}`;
    entries.push({ source: name, bytes: bytes.length, sha256, key, url: `${origin}/${key}` });
  }
  const byName = new Map(entries.map((entry) => [entry.source, entry.url]));

  const header = `/* 由 scripts/build-external-fonts.mjs 從 fonts-local.css 產生，不要手改。
   差別只有 url()：這一份指向 ${origin} 上以內容定址供應的檔案（v1/<sha256>/fonts/）。 */\n\n`;
  const css = header + local.replace(URL_RE, (_, name) => `url('${byName.get(name)}')`);
  const manifest = { origin, files: entries };
  return { css, manifest };
}

export async function readCommitted() {
  const [css, manifest] = await Promise.all([
    readFile(EXTERNAL_CSS, 'utf8').catch(() => ''),
    readFile(MANIFEST, 'utf8').catch(() => ''),
  ]);
  return { css, manifest };
}

export function serializeManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { css, manifest } = await buildExternalFonts();
  await writeFile(EXTERNAL_CSS, css);
  await writeFile(MANIFEST, serializeManifest(manifest));
  for (const entry of manifest.files) {
    console.log(`${entry.source} → ${entry.url} (${(entry.bytes / 1024).toFixed(0)} KB)`);
  }
  console.log(`\n已寫入 src/fonts-external.css 與 fonts/external-manifest.json，共 ${manifest.files.length} 個檔。`);
}

// 由 src/fonts-local.css 產生 src/fonts-external.css 與 fonts/external-manifest.json。
//
// 兩份 @font-face 的差別只有 url()：本地那份是套件相對路徑，交給 consumer 的 bundler 打包；
// 外部那份寫絕對路徑 /assets/fonts/<檔名>.<雜湊>.woff2，指向同一個 origin 上底座供應的那份。
// unicode-range、宣告順序、font-display 這些都從本地那份原樣抄過來——宣告順序決定常用面與
// 其餘面哪一個優先（見 fonts-local.css 的註解），兩份不一致就會有一個站的字型行為與別站不同。
//
// 檔名帶內容雜湊，所以底座那邊可以給一年期的 immutable；字型改了雜湊就變，讀者不必回頭問。
//
// 這支是產生器，不是檢查。改完字型或改完 fonts-local.css 就跑一次
// `node scripts/build-external-fonts.mjs`；有沒有跑由 validate-external-fonts.mjs 負責報。

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EXTERNAL_BASE = '/assets/fonts';

const LOCAL_CSS = path.join(ROOT, 'src/fonts-local.css');
const EXTERNAL_CSS = path.join(ROOT, 'src/fonts-external.css');
const MANIFEST = path.join(ROOT, 'fonts/external-manifest.json');

const URL_RE = /url\('\.\.\/fonts\/([A-Za-z0-9._-]+\.woff2)'\)/g;

const HEADER = `/* 由 scripts/build-external-fonts.mjs 從 fonts-local.css 產生，不要手改。
   差別只有 url()：這一份指向底座在 ${EXTERNAL_BASE}/ 供應的檔案，檔名帶內容雜湊。 */\n\n`;

/** 檔案內容的短雜湊。長度與 vite 的內容雜湊同為 8 個字元。 */
export function hashOf(bytes) {
  return createHash('sha256').update(bytes).digest('base64url').slice(0, 8);
}

/** 讀 fonts-local.css，回傳外部版的 CSS 與 manifest（不寫檔，檢查與產生共用）。 */
export async function buildExternalFonts() {
  const local = await readFile(LOCAL_CSS, 'utf8');
  const names = [...new Set([...local.matchAll(URL_RE)].map((match) => match[1]))];
  if (names.length === 0) throw new Error('fonts-local.css 沒有任何 ../fonts/*.woff2 引用');

  const entries = [];
  for (const name of names) {
    const bytes = await readFile(path.join(ROOT, 'fonts', name));
    const extension = path.extname(name);
    const hashed = `${name.slice(0, -extension.length)}.${hashOf(bytes)}${extension}`;
    entries.push({ source: name, hashed, bytes: bytes.length });
  }
  const byName = new Map(entries.map((entry) => [entry.source, entry.hashed]));

  const css = HEADER + local.replace(URL_RE, (_, name) => `url('${EXTERNAL_BASE}/${byName.get(name)}')`);
  const manifest = { base: EXTERNAL_BASE, files: entries };
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
    console.log(`${entry.source} → ${EXTERNAL_BASE}/${entry.hashed} (${(entry.bytes / 1024).toFixed(0)} KB)`);
  }
  console.log(`\n已寫入 src/fonts-external.css 與 fonts/external-manifest.json，共 ${manifest.files.length} 個檔。`);
}

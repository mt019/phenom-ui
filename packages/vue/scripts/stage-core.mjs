// Generated release inputs, not a second editable design system.
import { readFile, writeFile, mkdir, cp, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const here = fileURLToPath(new URL('..', import.meta.url)),
  root = resolve(here, '../..'),
  out = join(here, 'core');
await rm(out, { recursive: true, force: true });
await mkdir(join(out, 'styles'), { recursive: true });
const inputs = [
  'src/styles-external-fonts.css',
  'src/styles-base.css',
  'src/fonts-external.css',
  'src/styles/palettes.js',
  'src/styles/oklch.js',
  'tailwind-preset.js',
  'fonts/external-manifest.json',
  'assets/phenom-ring.svg',
  'scripts/vite-font-preload.mjs',
  'scripts/lib/font-delivery.mjs',
  // 站群共用的判定（消費端經 ./validators/lib/* 取）。font-chars.mjs 不打包：它依賴 fontkit，
  // 而 ui-vue 不帶子集檔，字型覆蓋檢查留在 phenom-ui。
  'scripts/lib/design-tokens.mjs',
  'scripts/lib/prose-typography.mjs',
  'scripts/lib/ui-copy.mjs',
  'scripts/lib/floating-surfaces.mjs',
  'scripts/lib/color-system.mjs',
  'scripts/lib/math-notation.mjs',
  'scripts/lib/absolute-paths.mjs',
  'scripts/lib/shell-chrome.mjs',
  'scripts/lib/vue-sources.mjs',
  ...(await readdir(join(root, 'src/styles')))
    .filter((f) => f.endsWith('.css'))
    .map((f) => 'src/styles/' + f),
];
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', ...inputs], { cwd: root, stdio: 'pipe' });
await mkdir(join(out, 'assets'), { recursive: true });
await mkdir(join(out, 'fonts'), { recursive: true });
await mkdir(join(out, 'scripts/lib'), { recursive: true });
// core/ 沒有 src/ 這一層：根目錄的 scripts/lib/color-system.mjs 以 ../../src/styles/ 取 oklch.js、
// palettes.js、tokens.css，進了 core/scripts/lib/ 要改成 ../../styles/。只改這一種路徑，改了就記進 manifest。
const REWRITES = { 'scripts/lib/color-system.mjs': [["'../../src/styles/", "'../../styles/"]] };
const files = [];
for (const source of inputs) {
  const sourceBytes = await readFile(join(root, source)),
    target = source.replace(/^src\//, '');
  let bytes = sourceBytes;
  const rewrites = REWRITES[source] ?? [];
  if (rewrites.length) {
    let text = sourceBytes.toString('utf8');
    for (const [from, to] of rewrites) {
      if (!text.includes(from)) throw new Error(`${source} 找不到要改寫的路徑 ${from}；原檔改了就改 REWRITES`);
      text = text.replaceAll(from, to);
    }
    bytes = Buffer.from(text, 'utf8');
  }
  await writeFile(join(out, target), bytes);
  files.push({
    source,
    target,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    ...(rewrites.length
      ? { sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'), rewrites: rewrites.map(([from, to]) => `${from} -> ${to}`) }
      : {}),
  });
}
await cp(join(root, 'LICENSE'), join(here, 'LICENSE'));
await cp(join(root, 'fonts/LICENSES.md'), join(out, 'FONT-LICENSES.md'));
await writeFile(
  join(out, 'source-manifest.json'),
  JSON.stringify(
    {
      schemaVersion: 1,
      repository: 'mt019/phenom-ui',
      sourceCommit: execFileSync('git', ['log', '-1', '--format=%H', '--', ...inputs], {
        cwd: root,
        encoding: 'utf8',
      }).trim(),
      policy: 'Generated from the existing root sources. Edit the originals, never core/.',
      files,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Staged ${files.length} framework-neutral design sources and validators (${Object.keys(REWRITES).length} with recorded path rewrites)`);

// Preserve a consumer's existing visual baseline during framework-only migration.
// Read immutable Git inputs; generated compatibility themes are never edited here.
const legacyRef = 'v0.1.31',
  legacyCommit = execFileSync('git', ['rev-parse', legacyRef + '^{commit}'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
// 字型不打包：相容主題六個 woff2 共 12.7 MB，與 src/fonts-external.css 指向的 assets.phenomcanvas.com
// 內容定址檔逐位元組相同（以 sha256 核），所以 styles.css 的 url('../fonts/<名>') 改指該網址。
// 每個名字都要在 fonts-external.css 找到同名、且 v0.1.31 的 blob sha256 與網址裡的 sha256 相等，否則中止。
const legacyPaths = [
  'src/styles.css',
  'src/styles/tokens.css',
  'src/styles/marks.css',
  'tailwind-preset.js',
  ...execFileSync('git', ['ls-tree', '-r', '--name-only', legacyRef, 'fonts'], {
    cwd: root,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter((f) => f && !f.endsWith('.woff2')),
];
const externalCss = await readFile(join(root, 'src/fonts-external.css'), 'utf8'),
  externalUrls = new Map(
    [...externalCss.matchAll(/url\('(https:\/\/assets\.phenomcanvas\.com\/v1\/([0-9a-f]{64})\/fonts\/([A-Za-z0-9._-]+\.woff2))'\)/g)].map(
      (m) => [m[3], { url: m[1], sha256: m[2] }],
    ),
  );
const legacyFiles = [],
  legacyFontRewrites = [];
for (const source of legacyPaths) {
  const sourceBytes = execFileSync('git', ['show', `${legacyCommit}:${source}`], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
  });
  let bytes = sourceBytes;
  if (source === 'src/styles.css') {
    let text = sourceBytes.toString('utf8');
    for (const m of [...text.matchAll(/url\('\.\.\/fonts\/([A-Za-z0-9._-]+\.woff2)'\)/g)]) {
      const name = m[1],
        external = externalUrls.get(name);
      if (!external) throw new Error(`相容主題字型 ${name} 在 src/fonts-external.css 沒有同名的外部檔`);
      const blob = execFileSync('git', ['show', `${legacyCommit}:fonts/${name}`], {
        cwd: root,
        maxBuffer: 16 * 1024 * 1024,
      });
      const sha = createHash('sha256').update(blob).digest('hex');
      if (sha !== external.sha256)
        throw new Error(`相容主題字型 ${name} 的 sha256 ${sha} 與外部檔 ${external.sha256} 不同，不能改指外部網址`);
      text = text.replaceAll(m[0], `url('${external.url}')`);
      legacyFontRewrites.push({ font: name, sha256: sha, url: external.url });
    }
    if (!legacyFontRewrites.length) throw new Error('相容主題 styles.css 找不到任何 ../fonts/ 的 url()，原檔改了就改這段');
    bytes = Buffer.from(text, 'utf8');
  }
  const target = join(out, 'legacy', legacyRef, source);
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, bytes);
  legacyFiles.push({
    source,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    ...(bytes !== sourceBytes
      ? { sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'), rewrites: ['../fonts/*.woff2 -> assets.phenomcanvas.com 內容定址網址'] }
      : {}),
  });
}
await writeFile(
  join(out, 'legacy', legacyRef, 'source-manifest.json'),
  JSON.stringify(
    {
      schemaVersion: 2,
      repository: 'mt019/phenom-ui',
      sourceCommit: legacyCommit,
      tag: legacyRef,
      policy:
        'Exact immutable legacy design inputs for framework migration; no manually editable duplicate theme. Fonts are not bundled: styles.css points at the byte-identical content-addressed files on assets.phenomcanvas.com.',
      files: legacyFiles,
      fonts: legacyFontRewrites,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Staged exact ${legacyRef} compatibility theme (${legacyFiles.length} inputs, ${legacyFontRewrites.length} fonts served from assets.phenomcanvas.com)`);

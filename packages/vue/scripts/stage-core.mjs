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
  ...(await readdir(join(root, 'src/styles')))
    .filter((f) => f.endsWith('.css'))
    .map((f) => 'src/styles/' + f),
];
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', ...inputs], { cwd: root, stdio: 'pipe' });
await mkdir(join(out, 'assets'), { recursive: true });
await mkdir(join(out, 'fonts'), { recursive: true });
await mkdir(join(out, 'scripts/lib'), { recursive: true });
const files = [];
for (const source of inputs) {
  const bytes = await readFile(join(root, source)),
    target = source.replace(/^src\//, '');
  await writeFile(join(out, target), bytes);
  files.push({
    source,
    target,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
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
console.log(`Staged ${files.length} unchanged framework-neutral design sources`);

// Preserve a consumer's existing visual baseline during framework-only migration.
// Read immutable Git inputs; generated compatibility themes are never edited here.
const legacyRef = 'v0.1.31',
  legacyCommit = execFileSync('git', ['rev-parse', legacyRef + '^{commit}'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
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
    .filter(Boolean),
];
const legacyFiles = [];
for (const source of legacyPaths) {
  const bytes = execFileSync('git', ['show', `${legacyCommit}:${source}`], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
  });
  const target = join(out, 'legacy', legacyRef, source);
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, bytes);
  legacyFiles.push({
    source,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}
await writeFile(
  join(out, 'legacy', legacyRef, 'source-manifest.json'),
  JSON.stringify(
    {
      schemaVersion: 1,
      repository: 'mt019/phenom-ui',
      sourceCommit: legacyCommit,
      tag: legacyRef,
      policy:
        'Exact immutable legacy design inputs for framework migration; no manually editable duplicate theme.',
      files: legacyFiles,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Staged exact ${legacyRef} compatibility theme (${legacyFiles.length} inputs)`);

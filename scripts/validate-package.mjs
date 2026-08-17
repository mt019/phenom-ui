import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'src/index.js',
  'src/styles.css',
  'src/styles-base.css',
  'src/styles-external-fonts.css',
  'src/fonts-local.css',
  'src/fonts-external.css',
  'src/styles/tokens.css',
  'fonts/external-manifest.json',
  'tailwind-preset.js',
  'fonts/HuiwenMincho-core-subset.woff2',
  'fonts/HuiwenMincho-ext-subset.woff2',
  'fonts/ChironSungHK-fallback-subset.woff2',
  'fonts/ErikasFarbband-subset.woff2',
  'fonts/ErikasFarbband-Bold-subset.woff2',
  'fonts/RadioNewsman-subset.woff2',
  'fonts/LICENSES.md',
  'fonts/SOURCE-NOTES.md',
];

for (const relative of required) {
  const info = await stat(path.join(root, relative));
  if (!info.isFile() || info.size === 0) throw new Error(`missing package asset: ${relative}`);
}

// 字型有兩種投遞，兩份 @font-face 都要引到全部六個檔：本地那份給 consumer 打包，外部那份
// 指向底座供應的 /assets/fonts/。少引一個檔的長相是那一面安靜地退回系統字。
const localCss = await readFile(path.join(root, 'src/fonts-local.css'), 'utf8');
const externalCss = await readFile(path.join(root, 'src/fonts-external.css'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(root, 'fonts/external-manifest.json'), 'utf8'));
const hashedBySource = new Map(manifest.files.map((entry) => [entry.source, entry.hashed]));
for (const font of required.filter((item) => item.endsWith('.woff2')).map((item) => path.basename(item))) {
  if (!localCss.includes(`../fonts/${font}`)) throw new Error(`fonts-local.css does not reference ${font}`);
  const hashed = hashedBySource.get(font);
  if (!hashed) throw new Error(`external-manifest.json does not list ${font}`);
  if (!externalCss.includes(`${manifest.base}/${hashed}`)) {
    throw new Error(`fonts-external.css does not reference ${hashed}`);
  }
}
if (/url\(['"]?\/fonts\//.test(localCss)) throw new Error('font URL must be package-relative');
// 引用端的入口不得帶到本地那份，否則字型照樣被打包進每個站，共用快取就沒了。
const externalEntry = await readFile(path.join(root, 'src/styles-external-fonts.css'), 'utf8');
if (externalEntry.includes('fonts-local.css')) {
  throw new Error('styles-external-fonts.css must not import fonts-local.css');
}

let leaks = '';
try {
  // grep 不用 rg：這台機器沒有真的 ripgrep 執行檔（shell 裡的 rg 是別名，
  // spawnSync 找不到），grep -rlE 語意相同、無匹配同樣 exit 1。
  leaks = execFileSync('grep', [
    '-rlE',
    String.raw`\.\./backNav|src/data|/Users/|Documents/NTU`,
    'src',
  ], { cwd: root, encoding: 'utf8' }).trim();
} catch (error) {
  if (error.status !== 1) throw error;
}
if (leaks) throw new Error(`shared package leaks app/private paths:\n${leaks}`);

execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [
  'src/index.js',
  '--bundle',
  '--format=esm',
  '--platform=browser',
  '--outfile=/tmp/phenom-ui-validate.js',
  '--external:react',
  '--external:react-dom',
  '--external:react-router-dom',
  '--external:lucide-react',
  '--external:@mdx-js/react',
  '--external:katex',
  '--loader:.woff2=file',
], { cwd: root, stdio: 'inherit' });

console.log(`phenom-ui package validation passed: ${required.length} required assets`);

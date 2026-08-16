import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'src/index.js',
  'src/styles.css',
  'src/styles/tokens.css',
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

const css = await readFile(path.join(root, 'src/styles.css'), 'utf8');
for (const font of required.filter((item) => item.endsWith('.woff2')).map((item) => path.basename(item))) {
  if (!css.includes(`../fonts/${font}`)) throw new Error(`styles.css does not reference ${font}`);
}
if (/url\(['"]?\/fonts\//.test(css)) throw new Error('font URL must be package-relative');

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

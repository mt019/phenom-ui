import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('package exposes source, styles, fonts, preset, and validators', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  assert.equal(pkg.name, '@phenomcanvas/ui');
  assert.equal(pkg.exports['.'], './src/index.js');
  assert.equal(pkg.exports['./styles.css'], './src/styles.css');
  assert.equal(pkg.exports['./tailwind-preset'], './tailwind-preset.js');
  assert.equal(pkg.exports['./fonts/*'], './fonts/*');
  assert.equal(pkg.exports['./validators/*'], './scripts/*');
});

test('font rights and package-relative delivery are recorded', async () => {
  const notes = await readFile(new URL('../fonts/SOURCE-NOTES.md', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(notes, /redistributed and embedded on the web/);
  assert.doesNotMatch(styles, /url\(['"]?\/fonts\//);
  for (const font of [
    'HuiwenMincho-subset.woff2',
    'ChironSungHK-fallback-subset.woff2',
    'ErikasFarbband-subset.woff2',
    'ErikasFarbband-Bold-subset.woff2',
    'RadioNewsman-subset.woff2',
  ]) assert.match(styles, new RegExp(`\\.\\./fonts/${font.replace('.', '\\.')}`));
});

test('shared source does not export Canvas business components', async () => {
  const index = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(index, /backNav|src\/data|Jirs|Constitutional|FrontDoor/);
});

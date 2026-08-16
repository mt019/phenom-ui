import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { openSync } from 'fontkit';

test('package exposes source, styles, fonts, preset, and validators', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  assert.equal(pkg.name, '@phenomcanvas/ui');
  assert.equal(pkg.exports['.'], './src/index.js');
  assert.equal(pkg.exports['./styles.css'], './src/styles.css');
  assert.equal(pkg.exports['./eyebrow'], './src/components/Eyebrow.jsx');
  assert.equal(pkg.exports['./tailwind-preset'], './tailwind-preset.js');
  assert.equal(pkg.exports['./fonts/*'], './fonts/*');
  assert.equal(pkg.exports['./validators/*'], './scripts/*');
});

// 授權紀錄改中文之後這條跟著改（2026-08-13 站主明令工程文件一律中文）。
test('字型的權利與套件相對路徑有記錄在案', async () => {
  const notes = await readFile(new URL('../fonts/SOURCE-NOTES.md', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(notes, /都可以再散布、可以嵌在網頁上/);
  assert.doesNotMatch(styles, /url\(['"]?\/fonts\//);
  for (const font of [
    'HuiwenMincho-core-subset.woff2',
    'HuiwenMincho-ext-subset.woff2',
    'ChironSungHK-fallback-subset.woff2',
    'ErikasFarbband-subset.woff2',
    'ErikasFarbband-Bold-subset.woff2',
    'RadioNewsman-subset.woff2',
  ]) assert.match(styles, new RegExp(`\\.\\./fonts/${font.replace('.', '\\.')}`));
});

// 顯示字體若漏掉變音字，瀏覽器會只用 fallback 畫兩個點：字面、油墨紋理與字重立刻分裂。
// 這不是可以接受的 graceful fallback。重做 subset 時必須保住服務語言的完整字形。
test('Erikas regular and bold natively cover German diacritics', () => {
  const required = [...'ÄÖÜäöüß'];
  for (const file of [
    '../fonts/ErikasFarbband-subset.woff2',
    '../fonts/ErikasFarbband-Bold-subset.woff2',
  ]) {
    const font = openSync(new URL(file, import.meta.url));
    for (const glyph of required) {
      assert.equal(
        font.hasGlyphForCodePoint(glyph.codePointAt(0)),
        true,
        `${file} is missing native ${glyph}`,
      );
    }
  }
});

test('shared source does not export Canvas business components', async () => {
  const index = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(index, /backNav|src\/data|Jirs|Constitutional|FrontDoor/);
});

test('every page shell carries eyebrow navigation into PageIdentity', async () => {
  for (const file of [
    '../src/components/PageShell.jsx',
    '../src/components/lab/ArticleLayout.jsx',
    '../src/components/lab/DashboardLayout.jsx',
  ]) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /eyebrowBack\s*=\s*null/);
    assert.match(source, /<PageIdentity[^>]*eyebrowBack=\{eyebrowBack\}/);
  }
});

test('an eyebrow with a back destination renders a real navigation link', async () => {
  const source = await readFile(new URL('../src/components/Eyebrow.jsx', import.meta.url), 'utf8');
  assert.match(source, /if \(back\)/);
  assert.match(source, /<Link[\s\S]*to=\{back\.href\}/);
  assert.doesNotMatch(source, /onClick=/);
});

// 2026-08-02 使用者明令「全局底層模板禁止原生醜 UI 滑動軌道 bar」。樣式套在全域選擇器上
// （不逐個 overflow 容器補，補就會漏一處，而漏的那處特別顯眼）。兩套語法都要有——
// Safari 不吃 scrollbar-color，只寫一套等於沒改。
test('the shared stylesheet replaces the native scrollbar in both syntaxes', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(styles, /scrollbar-width:\s*thin/);
  assert.match(styles, /scrollbar-color:/);
  assert.match(styles, /::-webkit-scrollbar-thumb\s*\{/);
});

// 右欄目次要出現在每一頁上，而「這頁有沒有標題可列」只有量過 DOM 才知道。以前那件事
// 由頁面傳 hideToc 宣告，於是有標題的頁面照樣可能沒有目次，而且沒有任何地方會報。
// 所以目次**內容**列不列，一律看量測結果。
//
// 但**軌道**留不留不能看量測結果：items 要等 effect 掛載讀完 DOM 才有值，預先渲染的
// HTML 與 hydration 第一幀因此一律少一條右軌，量測跑完才補上，整頁重排一次
// （2026-08-17 在 wealth.phenomcanvas.com 量到 CLS 0.133）。軌道只看 hideToc。
//
// 這道檢查釘住三件事：殼自己呼叫 useHeadings、目次內容的判斷式看得到量測結果、
// 格線的判斷式看不到量測結果。
test('page shells reserve the toc track up front and fill it from the headings they measured', async () => {
  for (const file of [
    '../src/components/lab/ArticleLayout.jsx',
    '../src/components/lab/DashboardLayout.jsx',
  ]) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /useHeadings\(bodyRef/, `${file}：殼要自己量標題`);
    assert.match(source, /const reserveToc = !hideToc/, `${file}：軌道留不留只看 hideToc`);
    assert.match(source, /const showToc = reserveToc && [\s\S]{0,80}items\.length/, `${file}：目次內容列不列要看量到幾個標題`);
    assert.doesNotMatch(source, /\{hideToc \? null :/, `${file}：不要再用 hideToc 單獨決定目次內容`);

    // 格線那幾條字串必須由 reserveToc 決定。抓法是看每一個 lg:grid-cols- 之前最近的那個
    // 判斷變數是哪一個——寫成 showToc 就是把軌道綁回量測結果，正是上面那個位移的成因。
    for (const [before] of source.matchAll(/[\s\S]{0,160}lg:grid-cols-\[15rem|[\s\S]{0,160}lg:grid-cols-\[minmax\(0,1fr\)_13rem/g)) {
      assert.doesNotMatch(before.slice(-160), /showToc/, `${file}：格線不准看 showToc，要看 reserveToc`);
    }
    assert.match(source, /reserveToc[\s\S]{0,160}lg:grid-cols-/, `${file}：格線要由 reserveToc 決定`);
  }
});

/*
 * 2026-08-27 從各站搬進共用層的那批判定，各自一個該過、一個該擋。
 *
 * 這批腳本先前在四個倉各一份副本，沒有一支有雙向測試——搬進共用層之後，一個站改壞了
 * 全部跟著壞，所以判定本身要有測試接著。每支另驗「掃到 0 個檔案要出錯」，那是這一族
 * 最常見的失效：參數傳錯，走訪清單是空的，檢查照樣印通過。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkProseTypography, readExceptions } from '../scripts/lib/prose-typography.mjs';
import { checkUiCopy } from '../scripts/lib/ui-copy.mjs';
import { checkMathNotation } from '../scripts/lib/math-notation.mjs';
import { checkFloatingSurfaces } from '../scripts/lib/floating-surfaces.mjs';
import { checkDesignTokens } from '../scripts/lib/design-tokens.mjs';
import { checkAbsolutePaths } from '../scripts/lib/absolute-paths.mjs';
import { checkShellChrome } from '../scripts/lib/shell-chrome.mjs';
import { checkVueSources } from '../scripts/lib/vue-sources.mjs';
import { execFileSync } from 'node:child_process';
import { stage } from '../scripts/lib/stage-cloudflare.mjs';
import { prune } from '../scripts/lib/prune-retired-public.mjs';

function sandbox(files) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-libs-'));
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return dir;
}

function inDir(dir, fn) {
  const previous = process.cwd();
  process.chdir(dir);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
}

test('行高：級距內放行，級距外報出來', () => {
  const dir = sandbox({
    'src/Ok.jsx': '<p className="leading-[1.85]">x</p>',
    'src/Bad.jsx': '<p className="leading-[1.95]">x</p>',
    'scripts/leading-exceptions.txt': '# 沒有例外\n',
  });
  try {
    const { problems, checked } = inDir(dir, () => checkProseTypography({
      root: 'src', exceptionsPath: 'scripts/leading-exceptions.txt',
    }));
    assert.equal(checked, 2);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /Bad\.jsx:1 leading-\[1\.95\]/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('行高：例外檔登記過的值放行', () => {
  const dir = sandbox({
    'src/Bad.jsx': '<p className="leading-[2.2]">x</p>',
    'scripts/leading-exceptions.txt': 'src/Bad.jsx\t2.2\t術語表的假名 ruby 要留行高\n',
  });
  try {
    const { problems, exceptions } = inDir(dir, () => checkProseTypography({
      root: 'src', exceptionsPath: 'scripts/leading-exceptions.txt',
    }));
    assert.deepEqual(problems, []);
    assert.equal(exceptions.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('行高：例外檔不存在要出錯，不當成空清單', () => {
  assert.throws(() => readExceptions('/nonexistent/leading-exceptions.txt'), /讀不到行高例外清單/);
});

test('介面文案：禁語報出來，註解裡的同一個詞放行', () => {
  const dir = sandbox({
    'src/Bad.jsx': "export const x = '這個站是研究地圖';",
    'src/Ok.jsx': "// 研究地圖這四個字寫在註解裡\nexport const y = '年表與全文';",
  });
  try {
    const { failures, checked } = inDir(dir, () => checkUiCopy({ root: 'src' }));
    assert.equal(checked, 2);
    assert.equal(failures.length, 1);
    assert.match(failures[0], /把內容說成地圖/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('介面文案：appPath 指到沒有 PAGE_META 的檔要出錯', () => {
  const dir = sandbox({ 'src/App.jsx': 'export default function App() { return null; }' });
  try {
    assert.throws(
      () => inDir(dir, () => checkUiCopy({ root: 'src', appPath: 'src/App.jsx' })),
      /找不到 PAGE_META/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('數學記號：Unicode 字元報出來，成對的中文刪節號放行', () => {
  const dir = sandbox({
    'src/content/bad.mdx': '母數 σ 未知。',
    'src/content/ok.mdx': '前引各節⋯⋯後略，公式寫 $\\sigma$。',
  });
  try {
    const { problems, checked } = inDir(dir, () => checkMathNotation({ roots: ['src/content'] }));
    assert.equal(checked, 2);
    assert.equal(problems.length, 1);
    assert.match(problems[0].file, /bad\.mdx/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('數學記號：資料層未渲染的 $…$ 報出來，allowFields 放行', () => {
  const dir = sandbox({
    'src/content/x.mdx': '正文。',
    'src/data/a.json': JSON.stringify({ blurb: '公式 $2^k$ 在這裡' }),
  });
  try {
    const reported = inDir(dir, () => checkMathNotation({ roots: ['src/content'], dataDirs: ['src/data'] }));
    assert.equal(reported.unrendered.length, 1);
    assert.equal(reported.unrendered[0].key, 'blurb');
    assert.equal(reported.dataChecked, 1);

    const allowed = inDir(dir, () => checkMathNotation({
      roots: ['src/content'], dataDirs: ['src/data'], allowFields: ['blurb'],
    }));
    assert.deepEqual(allowed.unrendered, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('數學記號：一行寫完的 $$…$$ 報出來', () => {
  const dir = sandbox({ 'src/content/x.mdx': '$$E = mc^2$$\n' });
  try {
    const { inlineDisplay } = inDir(dir, () => checkMathNotation({ roots: ['src/content'] }));
    assert.equal(inlineDisplay.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('數學記號：roots 是空陣列要出錯', () => {
  assert.throws(() => checkMathNotation({ roots: [] }), /缺少 roots/);
});

test('浮層：產生者以外的檔案寫 tooltip role 要報出來', () => {
  const dir = sandbox({
    'src/pages/Bad.jsx': '<div role="tooltip">x</div>',
    'src/components/lab/HoverCard.jsx': [
      "import { CARD_GAP as GAP, useFloatingCard } from './useFloatingCard.js';",
      'const { cardRef, pos } = useFloatingCard({ open });',
      "createPortal(node, document.body); document.addEventListener('pointerdown', close);",
      "if (e.key === 'Escape') close(); closeActiveCard = forceClose;",
    ].join('\n'),
    'src/components/lab/AnnotatedHtml.jsx': [
      "createPortal(node, document.body); document.addEventListener('pointerdown', close);",
      "if (event.key === 'Escape') close(); useFloatingCard({});",
      'const [active, setActive] = useState(null);',
    ].join('\n'),
    'src/components/lab/useFloatingCard.js': 'const left = window.innerWidth - cardW - CARD_GAP;',
  });
  try {
    const { failures, checked } = inDir(dir, () => checkFloatingSurfaces());
    assert.ok(checked >= 3, `掃到 ${checked} 個檔`);
    assert.equal(failures.length, 1);
    assert.match(failures[0], /tooltip role/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('浮層：產生者被搬走要報出來，不是安靜跳過', () => {
  const dir = sandbox({ 'src/pages/Ok.jsx': '<div>x</div>' });
  try {
    const { failures } = inDir(dir, () => checkFloatingSurfaces());
    assert.ok(failures.some((f) => /讀不到.*HoverCard\.jsx/.test(f)), failures.join('\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('浮層：產生者在 node_modules 那份時，掃描根與產生者各走各的前綴', () => {
  const producers = {
    'node_modules/@phenomcanvas/ui/src/components/lab/HoverCard.jsx': [
      "createPortal(node, document.body); document.addEventListener('pointerdown', close);",
      "if (e.key === 'Escape') close(); closeActiveCard = forceClose; useFloatingCard({ open });",
    ].join('\n'),
    'node_modules/@phenomcanvas/ui/src/components/lab/AnnotatedHtml.jsx': [
      "createPortal(node, document.body); document.addEventListener('pointerdown', close);",
      "if (event.key === 'Escape') close(); useFloatingCard({});",
      'const [active, setActive] = useState(null);',
    ].join('\n'),
    'node_modules/@phenomcanvas/ui/src/components/lab/useFloatingCard.js':
      'const left = window.innerWidth - cardW - CARD_GAP;',
  };
  const opts = {
    roots: ['src/pages/_constitutional-court'],
    producerPrefix: 'node_modules/@phenomcanvas/ui',
  };

  const ok = sandbox({ ...producers, 'src/pages/_constitutional-court/Case.jsx': '<div>x</div>' });
  try {
    const { failures, checked } = inDir(ok, () => checkFloatingSurfaces(opts));
    assert.equal(checked, 1);
    assert.deepEqual(failures, []);
  } finally {
    rmSync(ok, { recursive: true, force: true });
  }

  // 站自己的頁面寫回 group-hover 要報，而產生者不在掃描根裡也不能因此漏驗。
  const bad = sandbox({ 'src/pages/_constitutional-court/Case.jsx': '<div class="group-hover:block">x</div>' });
  try {
    const { failures } = inDir(bad, () => checkFloatingSurfaces(opts));
    assert.ok(failures.some((f) => /group-hover:block/.test(f)), failures.join('\n'));
    assert.ok(failures.some((f) => /讀不到.*HoverCard\.jsx/.test(f)), failures.join('\n'));
  } finally {
    rmSync(bad, { recursive: true, force: true });
  }
});

test('Cloudflare 排版：路由攤平成 <route>.html，空目錄清掉', () => {
  const dir = sandbox({
    'dist/index.html': '<html>root</html>',
    'dist/notes/index.html': '<html>notes</html>',
  });
  try {
    const flattened = stage({ dist: join(dir, 'dist'), routes: ['/', '/notes'] });
    assert.equal(flattened, 1);
    assert.ok(existsSync(join(dir, 'dist/notes.html')));
    assert.ok(!existsSync(join(dir, 'dist/notes')));
    assert.ok(existsSync(join(dir, 'dist/index.html')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Cloudflare 排版：預先渲染缺一條路由就出錯', () => {
  const dir = sandbox({ 'dist/index.html': '<html>root</html>' });
  try {
    assert.throws(
      () => stage({ dist: join(dir, 'dist'), routes: ['/notes'] }),
      /missing prerendered route \/notes/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Cloudflare 排版：一條都沒攤平要出錯', () => {
  const dir = sandbox({ 'dist/index.html': '<html>root</html>' });
  try {
    assert.throws(() => stage({ dist: join(dir, 'dist'), routes: ['/'] }), /排版沒有實際執行/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('退役投影檔：登記的刪掉，沒登記的留著', () => {
  const dir = sandbox({
    'dist/notes-assets/a.png': 'x',
    'dist/keep/b.png': 'x',
  });
  try {
    const removed = prune({ dist: join(dir, 'dist'), retired: ['notes-assets', 'never-existed'] });
    assert.deepEqual(removed, ['notes-assets']);
    assert.ok(!existsSync(join(dir, 'dist/notes-assets')));
    assert.deepEqual(readdirSync(join(dir, 'dist')), ['keep']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/*
 * 2026-11-07 ui-vue 0.4.1：九道判定打包進 ui-vue，掃描要認 .vue。每道一個該擋、一個該過。
 * color-system 只讀 tokens.css，不掃原始碼，沒有 .vue 的案例；absolute-paths 走 git ls-files，
 * 沙盒要先 git init。
 */
test('.vue：design tokens 抓 <template> 與 <style> 裡的 hex', () => {
  const dir = sandbox({
    'src/Bad.vue': '<template><div style="color:#123456">x</div></template>',
    'src/Ok.vue': '<template><div class="text-ink">x</div></template>\n<style>.a{color:var(--ink)}</style>',
  });
  try {
    const { violations, checked } = inDir(dir, () => checkDesignTokens({ root: 'src' }));
    assert.equal(checked, 2);
    assert.equal(violations.length, 1);
    assert.match(violations[0], /Bad\.vue:1 #123456/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('.vue：行高級距外報出來', () => {
  const dir = sandbox({
    'src/Bad.vue': '<template><p class="leading-[1.95]">x</p></template>',
    'src/Ok.vue': '<template><p class="leading-[1.85]">x</p></template>',
    'scripts/leading-exceptions.txt': '',
  });
  try {
    const { problems, checked } = inDir(dir, () => checkProseTypography({
      root: 'src', exceptionsPath: 'scripts/leading-exceptions.txt',
    }));
    assert.equal(checked, 2);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /Bad\.vue:1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('.vue：介面文案的禁語報出來，HTML 註解裡的放行', () => {
  const dir = sandbox({
    'src/Bad.vue': "<template><p>這個站是研究地圖</p></template>",
    'src/Ok.vue': '<template><!-- 研究地圖四個字在註解 --><p>年表</p></template>',
  });
  try {
    const { failures, checked } = inDir(dir, () => checkUiCopy({ root: 'src' }));
    assert.equal(checked, 2);
    assert.equal(failures.length, 1);
    assert.match(failures[0], /Bad\.vue:1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('.vue：數學字元報出來，$…$ 放行', () => {
  const dir = sandbox({
    'src/pages/Bad.vue': '<template><p>母數 σ</p></template>',
    'src/pages/Ok.vue': '<template><MathText text="$\\sigma$" /></template>',
  });
  try {
    const { problems, checked } = inDir(dir, () => checkMathNotation({ roots: ['src/pages'] }));
    assert.equal(checked, 2);
    assert.equal(problems.length, 1);
    assert.match(problems[0].file, /Bad\.vue/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('.vue：浮層 framework vue 查 ui-vue 的三個產生者', () => {
  const producers = {
    'node_modules/@phenomcanvas/ui-vue/src/components/reading/HoverCard.vue': [
      "let closeActiveCard = null; document.addEventListener('pointerdown', onDocDown);",
      "if (e.key === 'Escape') forceClose(); pos.value = placeFloatingCard({});",
      '<template><Teleport to="body"><div role="tooltip" /></Teleport></template>',
    ].join('\n'),
    'node_modules/@phenomcanvas/ui-vue/src/components/reading/AnnotatedHtml.vue': [
      "const active = shallowRef(null); document.addEventListener('pointerdown', outside);",
      "if (e.key === 'Escape') close(); left: Math.min(x, innerWidth - w - 8),",
      '<template><Teleport to="body"><div role="tooltip" /></Teleport></template>',
    ].join('\n'),
    'node_modules/@phenomcanvas/ui-vue/src/components/reading/floatingCard.js':
      'const left = Math.min(x, viewportW - cardW - CARD_GAP);',
  };
  const opts = { framework: 'vue', producerPrefix: 'node_modules/@phenomcanvas/ui-vue' };
  const ok = sandbox({ ...producers, 'src/pages/Ok.vue': '<template><HoverCard /></template>' });
  try {
    const { failures, checked } = inDir(ok, () => checkFloatingSurfaces(opts));
    assert.equal(checked, 1);
    assert.deepEqual(failures, []);
  } finally {
    rmSync(ok, { recursive: true, force: true });
  }
  const bad = sandbox({ ...producers, 'src/pages/Bad.vue': '<template><div role="tooltip">x</div></template>' });
  try {
    const { failures } = inDir(bad, () => checkFloatingSurfaces(opts));
    assert.equal(failures.length, 1);
    assert.match(failures[0], /Bad\.vue.*tooltip role/);
  } finally {
    rmSync(bad, { recursive: true, force: true });
  }
  assert.throws(() => checkFloatingSurfaces({ framework: 'svelte' }), /只認 react 或 vue/);
});

test('.vue：絕對路徑的家目錄字面值報出來', () => {
  const home = process.env.HOME;
  const dir = sandbox({
    'src/Bad.vue': `<template><a href="${home}/Documents/x.pdf">x</a></template>`,
    'src/Ok.vue': '<template><a href="/x.pdf">x</a></template>',
  });
  try {
    inDir(dir, () => {
      execFileSync('git', ['init', '-q']);
      execFileSync('git', ['add', '.']);
    });
    const { failures, checked } = inDir(dir, () => checkAbsolutePaths());
    assert.equal(checked, 2);
    // 家目錄字面值同時命中兩條（本機家目錄、別台 Mac 的個人目錄樣式），都落在 Bad.vue。
    assert.ok(failures.length >= 1);
    assert.ok(failures.every((f) => /Bad\.vue/.test(f)), failures.join('\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('.vue：外殼——落點、大標題連結、BackLink 樣式、寬容器內距、吸頂橫捲、捲軸樣式', () => {
  const css = ':root{} *{scrollbar-width: thin; scrollbar-color: a b} ::-webkit-scrollbar-thumb {x:y}';
  const ok = sandbox({
    'styles-base.css': css,
    'src/pages/Ok.vue': [
      '<script setup>',
      "const back = { href: 'https://phenomcanvas.com/', label: '' };",
      '</script>',
      '<template><ArticleLayout :back="back"><h1>題</h1></ArticleLayout></template>',
    ].join('\n'),
  });
  try {
    const r = inDir(ok, () => checkShellChrome({ shellCss: 'styles-base.css' }));
    assert.deepEqual(r.failures, []);
    assert.equal(r.pages, 1);
    assert.equal(r.withShell, 1);
  } finally {
    rmSync(ok, { recursive: true, force: true });
  }
  const bad = sandbox({
    'styles-base.css': ':root{}',
    'src/pages/Bad.vue': [
      '<script setup>',
      "const back = { href: 'https://example.com/', label: '' };",
      '</script>',
      '<template>',
      '  <div class="mx-auto max-w-6xl px-4 sm:px-6">',
      '    <nav class="sticky top-0"><div class="overflow-x-auto">t</div></nav>',
      '    <BackLink class="text-xs" />',
      '    <RouterLink to="/">',
      '      <h1>題</h1>',
      '    </RouterLink>',
      '  </div>',
      '</template>',
    ].join('\n'),
  });
  try {
    const { failures } = inDir(bad, () => checkShellChrome({ shellCss: 'styles-base.css' }));
    const expect = [/手寫了水平內距/, /吸頂欄橫向捲動/, /傳樣式/, /落點不是站群/, /大標題被包成連結/, /scrollbar-width/, /webkit-scrollbar-thumb/];
    for (const re of expect) assert.ok(failures.some((f) => re.test(f)), `缺 ${re}：\n${failures.join('\n')}`);
    assert.equal(failures.length, expect.length, failures.join('\n'));
  } finally {
    rmSync(bad, { recursive: true, force: true });
  }
  assert.throws(() => checkShellChrome({}), /缺少 shellCss/);
});

test('.vue：React 依賴報出來，src/data 不掃', () => {
  const dir = sandbox({
    'src/Bad.vue': "<script setup>\nimport { useState } from 'react';\n</script>",
    'src/Ok.vue': "<script setup>\nimport { ref } from 'vue';\n</script>",
    'src/lib/ok.js': "import { X } from '@phenomcanvas/ui-vue';",
    'src/data/skip.js': "import x from 'react-dom';",
  });
  try {
    const { failures, checked, vueFiles } = inDir(dir, () => checkVueSources({ root: 'src' }));
    assert.equal(checked, 3);
    assert.equal(vueFiles, 2);
    assert.equal(failures.length, 1);
    assert.match(failures[0], /Bad\.vue:2 React 依賴/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

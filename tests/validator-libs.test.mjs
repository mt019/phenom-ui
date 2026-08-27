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

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/*
 * ui-vue 0.4 新補三件（BookTree、HoverCard、Math）的伺服器端渲染。本檔不載入 DOM：
 * 元件在 setup 或渲染時摸到 document、window，這裡就會拋錯。客戶端掛載與監聽器的
 * 清理在 vue-mount.test.mjs。
 */
await import('./helpers/vue-sfc-register.mjs');
const src = new URL('../packages/vue/src/components/reading/', import.meta.url);
const load = async (name) => (await import(new URL(name, src).href)).default;
const { createSSRApp, h } = await import('vue');
const { renderToString } = await import('vue/server-renderer');
const { createMemoryHistory, createRouter } = await import('vue-router');

const items = [
  { id: 'a1', title: '總理遺教', href: '/p/a1', group: '第一部', subgroup: '甲', lead: 3 },
  { id: 'a2', title: '教育方針', href: '/p/a2', group: '第一部', subgroup: '甲', lead: 9, badge: '全文' },
  { id: 'a3', title: '大學制度', href: '/p/a3', group: '第一部', subgroup: '乙', lead: 15, hint: '原刊 1931' },
  { id: 'b1', title: '邊疆教育', href: '/p/b1', group: '第二部', lead: 40 },
];

async function render(component, props = {}, slots) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { render: () => null } }] });
  const app = createSSRApp({ render: () => h(component, props, slots) });
  app.use(router);
  await router.push('/');
  await router.isReady();
  return renderToString(app);
}

test('BookTree 伺服器端渲染：分組、分節、頁碼、標記與目前所在的那一篇', async () => {
  const BookTree = await load('BookTree.vue');
  const html = await render(BookTree, { items, activeId: 'a2' });
  assert.match(html, /<nav aria-label="全書目次" class="mt-3">/);
  assert.equal(html.match(/<section /g).length, 2, '兩個部次');
  assert.match(html, /aria-expanded="true"/, '部次預設展開');
  assert.match(html, />第一部<\/span><span[^>]*>3<\/span>/, '部次後附篇數');
  assert.match(html, />甲<\/p>/);
  assert.match(html, />乙<\/p>/);
  assert.equal(html.match(/<a /g).length, 4, '未傳 onSelect 時每篇是連結');
  assert.match(html, /href="\/p\/a3"[^>]*title="原刊 1931"/);
  assert.match(html, /<a href="\/p\/a2" class="[^"]*border-accent[^"]*" data-leaf-active>/);
  assert.equal(html.match(/data-leaf-active/g).length, 1);
  assert.match(html, />全文<\/span>/);
  assert.match(html, /placeholder="搜尋篇名…"/);
});

test('BookTree 傳 onSelect 時葉子是按鈕並帶 aria-current', async () => {
  const BookTree = await load('BookTree.vue');
  const html = await render(BookTree, { items, activeId: 'b1', onSelect: () => {}, label: '目次' }, { header: () => h('p', { class: 'hdr' }, '朱家驊言論集') });
  assert.match(html, /<p class="hdr">朱家驊言論集<\/p>/);
  assert.match(html, /aria-label="目次"/);
  assert.doesNotMatch(html, /<a /);
  assert.match(html, /<button type="button" aria-current="page" data-leaf-active/);
});

test('HoverCard 伺服器端只渲染標記，卡片不出現在 HTML 裡', async () => {
  const HoverCard = await load('HoverCard.vue');
  const html = await render(HoverCard, { label: '錢謙益', className: 'entity', card: h('b', '錢謙益') }, { default: () => '牧齋' });
  assert.match(html, /<span role="button" tabindex="0" aria-label="錢謙益" aria-expanded="false" class="entity">(<!--\[-->)?牧齋(<!--\]-->)?<\/span>/);
  assert.doesNotMatch(html, /role="tooltip"/);
  const plain = await render(HoverCard, { interactive: false, focusable: false }, { default: () => '詞' });
  assert.doesNotMatch(plain, /role="button"|tabindex/, 'interactive=false 時 pinnable 跟著是 false');
});

test('Math 行內與區塊公式', async () => {
  const MathComponent = await load('Math.vue');
  const inline = await render(MathComponent, { tex: 'x^2' });
  assert.match(inline, /^<span class=""><span class="katex">/);
  assert.match(inline, /<math/);
  const block = await render(MathComponent, { tex: '\\sum_i x_i', display: true, className: 'my-4' });
  assert.match(block, /^<div class="my-4"><span class="katex-display">/);
  const bad = await render(MathComponent, { tex: '\\frac{' });
  assert.match(bad, /katex-error|katex/, '語法錯誤不拋例外');
});

test('index.ts 匯出新補的元件', async () => {
  const index = await readFile(new URL('../packages/vue/src/index.ts', import.meta.url), 'utf8');
  for (const name of ['BookTree', 'HoverCard', 'Math', 'MathText']) {
    assert.match(index, new RegExp(`default as ${name} \\}`), name);
  }
});

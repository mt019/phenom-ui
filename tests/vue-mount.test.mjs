import assert from 'node:assert/strict';
import test from 'node:test';

/*
 * ui-vue 0.4 新補三件的客戶端掛載。DOM 由 happy-dom 提供，必須在 import vue 之前設好全域：
 * runtime-dom 在模組載入時就讀 document。監聽器的計數照 packages/vue-demo/tests/browser.mjs
 * 的做法攔 add／removeEventListener，只記掛在 document 與 window 上的，卸載之後必須歸零。
 * happy-dom 的 window 與 document 不經由 win.EventTarget.prototype 取這兩個方法，所以改包
 * 這兩個實例。
 */
await import('./helpers/vue-sfc-register.mjs');
const { Window } = await import('happy-dom');
const win = new Window({ url: 'http://localhost/', width: 1280, height: 800 });
for (const key of ['window', 'document', 'navigator', 'history', 'location', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'Event', 'KeyboardEvent', 'MouseEvent', 'requestAnimationFrame', 'cancelAnimationFrame', 'getComputedStyle']) {
  Object.defineProperty(globalThis, key, { value: key === 'window' ? win : win[key], configurable: true, writable: true });
}
const live = [];
const captureOf = (opts) => (typeof opts === 'boolean' ? opts : !!opts?.capture);
for (const target of [win, win.document]) {
  const add = target.addEventListener.bind(target), remove = target.removeEventListener.bind(target);
  target.addEventListener = (type, fn, opts) => {
    live.push({ target, type, fn, capture: captureOf(opts) });
    return add(type, fn, opts);
  };
  target.removeEventListener = (type, fn, opts) => {
    const i = live.findIndex((r) => r.target === target && r.type === type && r.fn === fn && r.capture === captureOf(opts));
    if (i >= 0) live.splice(i, 1);
    return remove(type, fn, opts);
  };
}
// 計數器本身要先證明看得到東西，否則歸零的斷言什麼都沒驗到。
{
  const probe = () => {};
  document.addEventListener('keydown', probe);
  window.addEventListener('scroll', probe, true);
  assert.equal(live.length, 2);
  document.removeEventListener('keydown', probe);
  window.removeEventListener('scroll', probe, true);
  assert.equal(live.length, 0);
}

const src = new URL('../packages/vue/src/components/reading/', import.meta.url);
const load = async (name) => (await import(new URL(name, src).href)).default;
const { createApp, h, nextTick } = await import('vue');
const { createMemoryHistory, createRouter } = await import('vue-router');

async function mount(component, props, slots) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { render: () => null } }] });
  const app = createApp({ render: () => h(component, props, slots) });
  app.use(router);
  await router.push('/');
  await router.isReady();
  app.mount(el);
  await nextTick();
  return { el, app, unmount: () => { app.unmount(); el.remove(); } };
}
const settle = async () => { await nextTick(); await new Promise((r) => setTimeout(r, 0)); await nextTick(); };

const items = [
  { id: 'a1', title: '總理遺教', href: '/p/a1', group: '第一部', subgroup: '甲', lead: 3 },
  { id: 'a2', title: '教育方針', href: '/p/a2', group: '第一部', subgroup: '甲', lead: 9 },
  { id: 'b1', title: '邊疆教育', href: '/p/b1', group: '第二部', lead: 40 },
];

test('BookTree：選篇、搜尋、收合部次，卸載後不留監聽器', async () => {
  const BookTree = await load('BookTree.vue');
  const picked = [];
  const view = await mount(BookTree, { items, activeId: 'a1', onSelect: (id) => picked.push(id) });
  const leaves = view.el.querySelectorAll('li button');
  assert.equal(leaves.length, 3);
  leaves[2].click();
  assert.deepEqual(picked, ['b1'], 'onSelect 收到該篇的 id');

  const input = view.el.querySelector('input[type="search"]');
  input.value = '教育';
  input.dispatchEvent(new win.Event('input'));
  await settle();
  assert.match(view.el.textContent, /2 篇符合/);
  assert.equal(view.el.querySelectorAll('section').length, 0, '搜尋時不顯示分組');
  input.value = '  ';
  input.dispatchEvent(new win.Event('input'));
  await settle();

  const head = view.el.querySelector('section button');
  head.click();
  await settle();
  assert.equal(head.getAttribute('aria-expanded'), 'false');
  assert.equal(view.el.querySelectorAll('section')[0].querySelectorAll('li').length, 0);
  head.click();
  await settle();
  assert.equal(view.el.querySelectorAll('section')[0].querySelectorAll('li').length, 2);

  view.unmount();
  assert.equal(live.length, 0, JSON.stringify(live.map((r) => r.type)));
});

test('HoverCard：聚焦即開、Esc 關閉、同時只開一張，卸載後監聽器歸零', async () => {
  const HoverCard = await load('HoverCard.vue');
  const Pair = {
    render: () => h('p', [
      h(HoverCard, { label: '甲', card: h('b', { class: 'card-a' }, '甲卡') }, { default: () => '甲' }),
      '，',
      h(HoverCard, { label: '乙' }, { default: () => '乙', card: () => h('b', { class: 'card-b' }, '乙卡') }),
    ]),
  };
  const view = await mount(Pair);
  const [a, b] = view.el.querySelectorAll('[role="button"]');
  a.dispatchEvent(new win.FocusEvent('focus'));
  await settle();
  assert.equal(a.getAttribute('aria-expanded'), 'true');
  const card = document.body.querySelector('[role="tooltip"]');
  assert.ok(card?.querySelector('.card-a'), '卡片 Teleport 到 body');
  assert.equal(a.getAttribute('aria-describedby'), card.id);
  assert.equal(live.length, 4, '開啟時掛 keydown、pointerdown、scroll、resize');

  document.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape' }));
  await settle();
  assert.equal(a.getAttribute('aria-expanded'), 'false');
  assert.equal(document.body.querySelector('[role="tooltip"]'), null);
  assert.equal(live.length, 0, '關閉後監聽器歸零');

  a.click();
  await settle();
  b.click();
  await settle();
  assert.equal(a.getAttribute('aria-expanded'), 'false', '開乙卡時關掉甲卡');
  assert.ok(document.body.querySelector('.card-b'));
  assert.equal(document.body.querySelectorAll('[role="tooltip"]').length, 1);

  view.unmount();
  await settle();
  assert.equal(document.body.querySelector('[role="tooltip"]'), null, '卸載時卡片一併移除');
  assert.equal(live.length, 0, JSON.stringify(live.map((r) => r.type)));
});

test('Math：區塊公式掛載為 div，行內為 span', async () => {
  const MathComponent = await load('Math.vue');
  const view = await mount({ render: () => [h(MathComponent, { tex: 'a+b', display: true }), h(MathComponent, { tex: 'c' })] });
  assert.ok(view.el.querySelector('div > .katex-display'));
  assert.ok(view.el.querySelector('span > .katex'));
  view.unmount();
  assert.equal(live.length, 0);
});

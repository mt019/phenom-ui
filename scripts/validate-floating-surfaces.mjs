// 浮層回歸守衛：consumer 不得把內容型 tooltip 寫回父層
// absolute/group-hover；掛名的浮層元件必須保留 portal 與關閉行為，
// 而定位（量兩次、夾回視窗內）只能來自共用的 useFloatingCard。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// 准許產生 role="tooltip" 的元件。要進這份名單，就要通過下面那組行為檢查；
// 名單之外的檔案一律不得自己長一張浮卡。
const SURFACES = [
  'src/components/lab/HoverCard.jsx',
  'src/components/lab/AnnotatedHtml.jsx',
];
const POSITIONING = 'src/components/lab/useFloatingCard.js';

const ROOT = process.argv[2] || 'src';
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const isSurface = (path) => SURFACES.some((surface) => path.endsWith(surface.replace(/^src\//, '')));
const files = walk(ROOT).filter((path) => /\.(jsx|tsx)$/.test(path) && !isSurface(path));
const failures = [];

for (const path of files) {
  const source = readFileSync(path, 'utf8');
  if (/group-hover(?:\/[\w-]+)?:block/.test(source)) {
    failures.push(`${relative('.', path)}：禁止以 group-hover:block 顯示浮層，改用 HoverCard portal`);
  }
  if (/role=["']tooltip["']/.test(source)) {
    failures.push(`${relative('.', path)}：tooltip role 只能由 ${SURFACES.join(' 或 ')} 產生`);
  }
}

// 定位邏輯只有一份。少了任何一條，兩個浮層元件會一起壞。
const positioning = readFileSync(POSITIONING, 'utf8');
for (const [needle, label] of [
  ['window.innerWidth - cardW - CARD_GAP', 'viewport 左右避讓'],
  ['requestAnimationFrame(place)', '卡片 mount 後重量一次'],
  ["window.addEventListener('scroll', place, true)", 'scroll 用 capture'],
]) {
  if (!positioning.includes(needle)) failures.push(`useFloatingCard 缺少核心行為：${label}`);
}

for (const surface of SURFACES) {
  const source = readFileSync(surface, 'utf8');
  const name = surface.split('/').pop().replace(/\.jsx$/, '');
  for (const [needle, label] of [
    ['createPortal(', 'portal 脫離裁切層'],
    ["document.addEventListener('pointerdown'", '點外關閉'],
    ["=== 'Escape'", 'Esc 關閉'],
    ['useFloatingCard(', '定位走共用 hook'],
  ]) {
    if (!source.includes(needle)) failures.push(`${name} 缺少核心行為：${label}`);
  }
}

// 全域互斥只有 HoverCard 有；同頁若同時開了兩種浮層，兩張卡會並存。
// 真的撞到再往共用層搬，這裡先把現況釘住。
if (!readFileSync(SURFACES[0], 'utf8').includes('closeActiveCard')) {
  failures.push('HoverCard 缺少核心行為：單次只開一張');
}

if (failures.length) {
  console.error(`floating surface validation failed:\n${failures.map((line) => `- ${line}`).join('\n')}`);
  process.exit(1);
}
console.log(`floating surfaces ok: ${files.length} files，內容型浮層限 ${SURFACES.length} 個元件，定位共用 useFloatingCard`);

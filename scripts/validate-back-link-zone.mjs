// 返回鍵的熱區檢查。
//
// 為什麼需要它：2026-07-30 站主在 canvas 說「hover 顯示箭頭的範圍也太大了吧」，canvas 當天
// 就把 `group` 從抬頭列搬到 BackLink 自己的 wrapper 上；這個套件沒跟上，於是十三個消費站
// 又過了兩個半月才被站主在拆出去的站上看到同一件事（2026-08-17）。判準寫進元件之後，還要
// 有人看著呼叫端不要把 `group` 加回那一列——靠人記得就會漏，而漏掉的時候畫面是正常的。
//
// 兩條：
//   1. BackLink 自己要有一個 `w-fit` 的熱區 wrapper，`group` 出現在它上面。
//   2. src/ 底下畫 <BackLink 的那一列容器不得帶 `group`（帶了熱區就變成整條列）。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

// JSX 註解與區塊註解裡的字不算程式碼（狀態機；只看行首 `//` 抓不到 `{/* */}`）。
const stripComments = (text) => text
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

const errors = [];

const backLinkPath = join(srcDir, 'components/BackLink.jsx');
const backLink = stripComments(readFileSync(backLinkPath, 'utf8'));
const zones = [...backLink.matchAll(/const\s+(\w*ZONE\w*)\s*=\s*'([^']*)'/g)];
if (zones.length === 0) {
  errors.push(`${relative(root, backLinkPath)}：找不到熱區 wrapper（形如 const ZONE = '…'）`);
}
for (const [, name, classes] of zones) {
  if (!/\bgroup\b/.test(classes)) {
    errors.push(`${relative(root, backLinkPath)}：${name} 沒有 group，熱區不會生效`);
  }
  // 浮動版是 fixed 定位，本來就不佔一整行，不必 w-fit。
  if (!/\bw-fit\b/.test(classes) && !/\bfixed\b/.test(classes)) {
    errors.push(`${relative(root, backLinkPath)}：${name} 沒有 w-fit，熱區會撐滿整行`);
  }
}
if (!/<span className=\{[^}]*ZONE/.test(backLink)) {
  errors.push(`${relative(root, backLinkPath)}：<Link> 沒有包在熱區 wrapper 裡`);
}

for (const path of walk(srcDir).filter((p) => p.endsWith('.jsx'))) {
  const lines = stripComments(readFileSync(path, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    if (!line.includes('<BackLink')) return;
    // 往上找最近的那個容器 div，看它有沒有 group。
    for (let j = i - 1; j >= 0 && j >= i - 4; j -= 1) {
      if (!lines[j].includes('<div')) continue;
      if (/\bgroup\b/.test(lines[j])) {
        errors.push(`${relative(root, path)}:${j + 1}：畫 BackLink 的那一列掛了 group，`
          + '熱區會變成整條抬頭列。熱區歸 BackLink 自己管，這裡只決定它放在哪。');
      }
      break;
    }
  });
}

if (errors.length) {
  console.error('返回鍵熱區檢查未通過：');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('返回鍵熱區檢查通過：熱區在 BackLink 自己的 wrapper 上，沒有殼把 group 加回那一列。');

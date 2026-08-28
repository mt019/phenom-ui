// 產物裡的字型檔要有東西引用它，字型的 preload 也要指向被引用的檔——站群唯一一份。
//
// 來歷（2026-08-28，手記）：該站 2026-08-01 裁了一份 1.75 MB 的固定子集，由 vite 的一個
// plugin 把套件的字型網址換成它。套件 v0.1.34 把 styles.css 拆成兩行 @import 之後，那個
// plugin 要找的字串不在被 transform 的檔案裡，String.replace 找不到就原樣返回，替換靜默
// 失效。子集從此沒有任何 @font-face 引用，而 index.html 仍然 preload 它——preload 不需要
// CSS 引用就會發請求，於是每一頁下載 1.75 MB，下載完閒置在快取裡。
//
// 當時那個站的三條字型檢查是「檔在不在」「有沒有超過 2 MiB」「HTML 有沒有那行 preload」，
// 壞掉的狀態下三條全過。存在性與大小都是那個檔自己說了算的判準，看不到「有沒有人用它」。
//
// 這裡不驗位元組預算：各站的內容量差很多，一個共用的上限不是太鬆就是常常要改。驗的是
// 「下載的東西有沒有用」，那件事在每個站都一樣。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FONT_EXT = /\.(woff2?|ttf|otf)$/i;

/**
 * @param {{dist: string}} options dist 是要檢查的產物目錄。
 * @returns {{failures: string[], fonts: number, stylesheets: number, documents: number}}
 */
export function checkFontDelivery({ dist }) {
  const fonts = [];
  const stylesheets = [];
  const documents = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { walk(path); continue; }
      if (!entry.isFile()) continue;
      if (FONT_EXT.test(entry.name)) fonts.push({ name: entry.name, path });
      else if (entry.name.endsWith('.css')) stylesheets.push(path);
      else if (entry.name.endsWith('.html')) documents.push(path);
    }
  };
  walk(dist);

  const failures = [];
  // 一個對象都沒看到就是失敗。掃錯目錄、產物還沒建、副檔名判斷寫壞，這三種情形的畫面
  // 與「全部通過」一模一樣。
  if (stylesheets.length === 0) failures.push(`${dist} 底下找不到任何 CSS，這道檢查什麼都沒看到`);
  if (documents.length === 0) failures.push(`${dist} 底下找不到任何 HTML，這道檢查什麼都沒看到`);

  const css = stylesheets.map((path) => readFileSync(path, 'utf8')).join('\n');
  const orphans = fonts.filter(({ name }) => !css.includes(name));
  if (orphans.length > 0) {
    const detail = orphans
      .map(({ name, path }) => `${name}（${(statSync(path).size / 1024).toFixed(0)} KB）`)
      .join('、');
    failures.push(`有 ${orphans.length} 個字型檔沒有任何 CSS 引用：${detail}`);
  }

  for (const path of documents) {
    const html = readFileSync(path, 'utf8');
    for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
      if (!/rel="preload"/.test(tag) || !/as="font"/.test(tag)) continue;
      const href = /href="([^"]+)"/.exec(tag)?.[1];
      if (!href) continue;
      const name = href.split('/').pop().split('?')[0];
      if (!css.includes(name)) {
        failures.push(`${path} 預載的字型 ${name} 沒有任何 CSS 引用，下載完不會被用到`);
      }
    }
  }

  return { failures, fonts: fonts.length, stylesheets: stylesheets.length, documents: documents.length };
}

/** 各站的薄殼呼叫這一支：印結果，有問題就 exit 1。 */
export function runFontDelivery(options) {
  const { failures, fonts, stylesheets, documents } = checkFontDelivery(options);
  if (failures.length > 0) {
    console.error('字型投遞有問題：');
    for (const failure of failures) console.error(`  ${failure}`);
    console.error('\n沒有人引用的字型檔要從產物裡拿掉，指向它的 preload 也要一起拿掉；');
    console.error('若那個檔本來就該被用到，是宣告 @font-face 的那一步沒有生效。');
    process.exit(1);
  }
  console.log(`字型投遞通過：${fonts} 個字型檔都有 CSS 引用，掃過 ${stylesheets} 份 CSS、${documents} 份 HTML。`);
}

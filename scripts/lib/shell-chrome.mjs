// 外殼寫法的固定檢查——站群唯一一份，掃 .vue 與 .jsx。
//
// 2026-11-07 自 phenom-guzhun 的 validate-shell-chrome.mjs 搬來，收第一、二、四、六、七節；
// 原第三、五節繫於 canvas 單體的 backNav.js（SITE_HOMES、siteHomeFor），拆出去的站沒有那份
// 表，不搬。各節的來歷寫在各節前。
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const path = join(dir, e.name);
  return e.isDirectory() ? walk(path) : [path];
});
const SOURCE = /\.(?:vue|jsx)$/;

// 會撐到接近視窗寬的容器。窄欄（max-w-3xl／2xl／52rem…）置中後兩側自帶大片外邊界，不列管。
const WIDE = /max-w-(?:6xl|7xl|\[8[0-9]rem\])/;
const HARDCODED = /px-4(?:\s+sm:px-6)?/;
// 常數只准在 shellPadding.js 裡定義，不准有人在別處複製一份字面值。
const PAD_LITERAL = /['"`]px-4 sm:px-6 lg:px-(?:16|10)/;
// 吸頂列往下看幾行找 overflow-x-auto（外層 <nav> 吸頂、內層 <div> 捲動分屬兩行）。
const WINDOW = 8;
// 殼會自己畫返回鍵；頁面也可以自己放 <BackLink />。
const PROVIDES_BACK = /<(?:ArticleLayout|DashboardLayout|PageShell|SiteHeader|BackLink)\b/;
// 拆出去的站顯式傳 back：JSX 寫 back={{ href: … }}，Vue 寫 :back="{ href: … }" 或
// script 裡 const back = { href: … }。落點限站群的網址（首頁或 /all）。
const BACK_LITERAL = /(?:\bback=\{\{|:back="\{|\bback\s*=\s*\{)/;
const BACK_TARGET = /href:\s*'https:\/\/phenomcanvas\.com\/(all)?'/;

function* codeLines(source) {
  // 註解裡引用舊寫法（說明當年為什麼改）不算違規，所以要會分辨程式與註解。
  let inBlock = false;
  for (const [i, line] of source.split('\n').entries()) {
    const was = inBlock;
    const opens = Math.max(line.lastIndexOf('/*'), line.lastIndexOf('<!--'));
    const closes = Math.max(line.lastIndexOf('*/'), line.lastIndexOf('-->'));
    if (opens > closes) inBlock = true;
    else if (closes > opens) inBlock = false;
    if (was || inBlock || line.trim().startsWith('//')) continue;
    yield [i, line];
  }
}

/**
 * @param {object} opts
 * @param {string} [opts.root]     掃描根，預設 src
 * @param {string} [opts.pagesDir] 路由頁所在目錄，預設 src/pages；第四節只掃這裡
 * @param {string} opts.shellCss   帶全域捲軸樣式的 CSS 路徑（消費端指到套件的 styles-base.css）
 */
export function checkShellChrome({ root = 'src', pagesDir = join(root, 'pages'), shellCss } = {}) {
  if (!shellCss) throw new Error('shell-chrome：缺少 shellCss（全域捲軸樣式所在的 CSS 路徑）');
  const files = walk(root).filter((p) => SOURCE.test(p));
  const failures = [];
  const rel = (p) => relative('.', p);

  for (const path of files) {
    const source = readFileSync(path, 'utf8');
    const lines = source.split('\n');

    /* 一、寬容器的水平內距只有一個來源：shellPadding.js。 */
    for (const [i, line] of codeLines(source)) {
      if (!line.includes('mx-auto') || !WIDE.test(line) || !HARDCODED.test(line)) continue;
      if (line.includes('SHELL_PAD_X')) continue;
      failures.push(
        `${rel(path)}:${i + 1}：寬容器手寫了水平內距。改用 shellPadding.js 的 `
        + 'SHELL_PAD_X／SHELL_PAD_X_RAIL／SHELL_PAD_X_TIGHT，別讓正文在寬螢幕上貼著視窗左緣',
      );
    }
    if (!path.endsWith('shellPadding.js') && PAD_LITERAL.test(source)) {
      failures.push(`${rel(path)}：把內距值抄了一份。匯入 shellPadding.js 的常數，不要複製字面值`);
    }

    /* 二、吸頂分頁列不橫捲（2026-07-28 明令）。 */
    for (const [i, line] of lines.entries()) {
      if (!/\bsticky\b/.test(line)) continue;
      for (let j = i; j < Math.min(i + WINDOW, lines.length); j += 1) {
        if (j > i && /<\/(?:nav|header|div)>/.test(lines[j])) break;
        if (/overflow-x-auto/.test(lines[j])) {
          failures.push(
            `${rel(path)}:${j + 1}：吸頂欄橫向捲動（吸頂容器在第 ${i + 1} 行）。`
            + '改成 flex-wrap 換行；真的放不下就是標籤太多，重新分組而不是讓它捲',
          );
          break;
        }
      }
    }

    /* 六、返回鍵的外觀不准逐頁傳（2026-07-30）。 */
    for (const [i, line] of lines.entries()) {
      if (!/<BackLink\b[^>]*\b(?:className|class)=/.test(line)) continue;
      failures.push(
        `${rel(path)}:${i + 1}：又給返回鍵傳樣式了。BackLink 沒有 class——`
        + '外觀與隱形都歸元件，要換 hover 色就在該頁的頁面級變數表加一行 `--backlink-accent`',
      );
    }
  }

  /* 四、路由頁：箭頭落點限站群網址；大標題不是連結（2026-07-29）。 */
  const pages = existsSync(pagesDir) ? walk(pagesDir).filter((p) => SOURCE.test(p)) : [];
  for (const path of pages) {
    const source = readFileSync(path, 'utf8');
    const lines = source.split('\n');
    for (const [i, line] of codeLines(source)) {
      if (BACK_LITERAL.test(line) && /href:/.test(line) && !BACK_TARGET.test(line)) {
        failures.push(
          `${rel(path)}:${i + 1}：箭頭的落點不是站群的網址。`
          + "拆出去的站顯式傳 back，落點寫 https://phenomcanvas.com/ 或 /all；整頁不畫才傳 null",
        );
      }
      if (!/<h1[\s>]|\{heading\}|\{titleEl\}/.test(line)) continue;
      const before = lines.slice(Math.max(0, i - 6), i).join('\n');
      if (/<(?:Link|RouterLink|a)\b[^>]*$|<(?:Link|RouterLink|a)\b[^>]*>\s*$/.test(before.trimEnd())) {
        failures.push(
          `${rel(path)}:${i + 1}：大標題被包成連結。全站的大標題都不可點——`
          + '回素首頁用左上角的箭頭，回這個站的首頁用眉標上的站名',
        );
      }
    }
  }
  const withShell = pages.filter((p) => PROVIDES_BACK.test(readFileSync(p, 'utf8'))).length;

  /* 七、捲軸不准是原生那條（2026-08-02）。 */
  let css;
  try {
    css = readFileSync(shellCss, 'utf8');
  } catch {
    failures.push(`讀不到 ${shellCss}，捲軸樣式沒檢查到`);
    css = '';
  }
  if (css) {
    if (!/scrollbar-width:\s*thin/.test(css) || !/scrollbar-color:/.test(css)) {
      failures.push(`${shellCss}：少了 scrollbar-width／scrollbar-color（Firefox 與新版 Chrome 走這套）`);
    }
    if (!/::-webkit-scrollbar-thumb\s*\{/.test(css)) {
      failures.push(`${shellCss}：少了 ::-webkit-scrollbar-thumb（Safari 不吃 scrollbar-color，只寫一套等於沒改）`);
    }
  }

  return { failures, checked: files.length, pages: pages.length, withShell };
}

/** 各倉的閘照這支跑。 */
export function runShellChrome(opts) {
  const { failures, checked, pages, withShell } = checkShellChrome(opts);
  if (checked === 0) {
    console.error(`外殼檢查一個檔案都沒讀到（掃描根 ${opts?.root ?? 'src'}），檢查沒有實際執行。`);
    process.exit(1);
  }
  if (failures.length) {
    console.error(`shell chrome validation failed:\n${failures.map((l) => `- ${l}`).join('\n')}`);
    process.exit(1);
  }
  console.log(
    `shell chrome ok: ${checked} 個檔；${pages} 個路由頁（${withShell} 個走殼或自放 BackLink），`
    + '寬容器內距全部來自 shellPadding.js，吸頂列不橫捲，箭頭落點限站群網址，大標題不是連結，捲軸樣式兩套都在',
  );
}

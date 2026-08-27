// 從本機字型母庫重建 CJK 與拉丁子集——站群唯一一份。
//
// 作法（2026-07-18，canvas）：內文字型一次子集到一組固定、涵蓋常用 BMP 的字元集
// （見 font-chars.mjs 的 comprehensiveChars），而非網站當下用到的那些字。一般新文章
// 不會帶進常用 CJK 以外的字，所以內文子集建一次就不必再建，沒有母庫的建置環境也不必建。
//
// 兩個字面疊在同一個家族名底下：內文字型畫正文，備援字型只補內文字型畫不出來的那幾個
// 碼位，靠 index.css 的 unicode-range @font-face 生效，因此它小而隨文字變動。
//
// 需要 pyftsubset（fonttools）與本機字型母庫。
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import * as fontkit from 'fontkit';

function requirePyftsubset() {
  try {
    execFileSync('pyftsubset', ['--help'], { stdio: 'ignore' });
  } catch {
    console.error('找不到 pyftsubset（fonttools）。先裝 fonttools 再跑一次；子集沒有重建，既有的 woff2 原封不動。');
    process.exit(1);
  }
}

/**
 * @param {object} opts
 * @param {Record<string, {source: string, text: string[]}>} opts.targets
 *        產物路徑 → {來源字型, 要涵蓋的字元}
 * @returns {string[]} 實際重建的產物路徑
 */
export function rebuildFontSubsets({ targets }) {
  if (!targets || Object.keys(targets).length === 0) {
    throw new Error('rebuild-font-subsets：targets 是空的，沒有東西可以重建。');
  }
  requirePyftsubset();

  for (const [target, cfg] of Object.entries(targets)) {
    if (!existsSync(cfg.source)) {
      console.error(`source font missing: ${cfg.source}`);
      console.error('把 FONT_LIBRARY_ROOT 指到字型母庫，再在本機重跑一次。');
      process.exit(1);
    }
    if (!existsSync(dirname(target))) {
      throw new Error(`產物目錄不存在：${dirname(target)}`);
    }
  }

  const built = [];
  const tmp = mkdtempSync(join(tmpdir(), 'phenom-font-build-'));
  try {
    for (const [target, cfg] of Object.entries(targets)) {
      if (cfg.text.length === 0) {
        console.log(`skipped ${target} (nothing to cover)`);
        continue;
      }
      const textFile = join(tmp, `${target.replace(/\W/g, '_')}.txt`);
      writeFileSync(textFile, cfg.text.join(''));
      const args = [
        cfg.source,
        `--text-file=${textFile}`,
        '--flavor=woff2',
        '--layout-features=*',
        '--ignore-missing-glyphs',
        `--output-file=${target}`,
      ];
      try {
        execFileSync('pyftsubset', args, { encoding: 'utf8' });
      } catch (error) {
        console.error(`pyftsubset 產生 ${target} 失敗：${error.message}`);
        process.exit(1);
      }
      built.push(target);
      console.log(`rebuilt ${target} (${cfg.text.length} glyph targets)`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  if (built.length === 0) {
    throw new Error('rebuild-font-subsets：一個子集都沒有重建，重建沒有實際執行。');
  }
  return built;
}

/**
 * 備援字型的 unicode-range：只有 range 裡指名的碼位會用它，所以 index.css 要與子集同步。
 * @returns {{range: string, uncovered: string[]}}
 */
export function fallbackUnicodeRange({ fallbackSource, fallbackChars }) {
  const font = fontkit.openSync(fallbackSource);
  const covered = fallbackChars.filter((c) => font.hasGlyphForCodePoint(c.codePointAt(0)));
  const uncovered = fallbackChars.filter((c) => !font.hasGlyphForCodePoint(c.codePointAt(0)));
  const range = covered
    .map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'))
    .sort()
    .join(', ');
  return { range, uncovered };
}

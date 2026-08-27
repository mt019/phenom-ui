// 退役頁面留在 public/ 的投影檔——站群唯一一份。
//
// Vite 把 public/ 整份複製進產物，所以退役頁面的投影檔不刪就照樣上線。
// 各站給自己的退役清單（相對產物根目錄的路徑）。
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @param {object} opts
 * @param {string} opts.dist       產物根目錄
 * @param {string[]} opts.retired  相對 dist 的退役目錄或檔案
 */
export function prune({ dist, retired }) {
  if (!dist) throw new Error('prune-retired-public：缺少 dist');
  if (!Array.isArray(retired)) throw new Error('prune-retired-public：retired 要是陣列');

  const removed = [];
  for (const name of retired) {
    const path = join(dist, name);
    if (!existsSync(path)) continue;
    rmSync(path, { recursive: true });
    if (existsSync(path)) throw new Error(`retired public projection still exists: ${path}`);
    removed.push(name);
  }
  console.log(
    retired.length === 0
      ? '沒有登記退役的 public 投影檔。'
      : `退役的 public 投影檔：登記 ${retired.length} 項，本次刪掉 ${removed.length} 項${removed.length ? `（${removed.join('、')}）` : ''}。`,
  );
  return removed;
}

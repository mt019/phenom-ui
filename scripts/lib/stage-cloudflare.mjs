// Cloudflare 的靜態資產排版——站群唯一一份。
//
// 預先渲染產出的是 <route>/index.html；Cloudflare 對這種形狀會把 /route 轉去 /route/，
// 網址因此多一個尾斜線。改名成 <route>.html 之後，無副檔名、無尾斜線的網址直接命中。
import { existsSync, renameSync, rmdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

// 攤平之後留下的空目錄逐層往上刪，遇到還有東西的目錄就停。
// 各站原本那份寫的是 rmSync(current, { dir: true })——`dir` 不是 rmSync 的選項，
// 對目錄呼叫 rmSync 而不給 recursive 會丟 ERR_FS_EISDIR，被 catch 吞掉，
// 於是空目錄一個都沒刪成。rmdirSync 正好只刪空目錄，目錄非空時丟 ENOTEMPTY。
function removeEmptyParents(path, dist) {
  let current = path;
  while (current !== dist) {
    try { rmdirSync(current); } catch { break; }
    current = dirname(current);
  }
}

/**
 * @param {object} opts
 * @param {string} opts.dist      產物根目錄
 * @param {string[]} opts.routes  要攤平的路由（`/` 會跳過）
 */
export function stage({ dist, routes }) {
  if (!dist) throw new Error('stage-cloudflare：缺少 dist');
  if (!Array.isArray(routes)) throw new Error('stage-cloudflare：routes 要是陣列');

  let flattened = 0;
  for (const route of routes) {
    if (route === '/') continue;
    const source = join(dist, route, 'index.html');
    const target = join(dist, `${route}.html`);
    if (!existsSync(source)) throw new Error(`Cloudflare staging: missing prerendered route ${route}`);
    renameSync(source, target);
    removeEmptyParents(dirname(source), dist);
    flattened += 1;
  }

  if (flattened === 0) {
    throw new Error(`Cloudflare staging：一條路由都沒有攤平（收到 ${routes.length} 條），排版沒有實際執行。`);
  }
  console.log(`Cloudflare staging: flattened ${flattened} route index files to preserve extensionless URLs without trailing slashes`);
  return flattened;
}

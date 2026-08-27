// 正文行高的固定檢查——站群唯一一份。
//
// 來歷（2026-08-13，canvas）：德川頁的對讀分頁行高寫 leading-[2]，導言寫 1.95，年表寫 1.8，
// 而 DESIGN.md 訂的正文是 18px／1.85、共用的 Prose 元件也是 1.85。站主翻分頁時看得出來
// 「這一頁不一樣」，卻看不出來差在哪裡，因為每一頁都只差一點點。全站掃過去，
// 1.75、1.9、1.95、2.05 各有幾處，全是手寫時憑感覺填的。
//
// 這種偏移不會壞掉任何東西，所以沒有人會回報，只會一直長。判準因此要機器守：
// 行高是設計系統的參數，不是逐頁的品味。要新增一個值，先改 DESIGN.md 與這裡的 SCALE，
// 讓它成為全站的選項；真的只此一處的例外由各站寫進自己的例外檔並附理由。
//
// 只管 leading-[數字] 這種任意值；Tailwind 的具名 leading（snug、relaxed、none）是標題與
// 介面用的，另有分寸，不在此列。
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SCALE = new Map([
  ['1.85', '正文（18px 內文、DESIGN.md 的基準）'],
  ['1.8', '次要文字與清單（14–16px）'],
  ['1.7', '程式碼與表格'],
]);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    return e.isDirectory() ? walk(path) : [path];
  });
}

/**
 * 各站的例外檔，一行一筆：`路徑<TAB>值<TAB>理由`（# 開頭與空行忽略）。
 * 檔案不存在就報錯，不當成空清單——空清單與「例外檔讀不到」在結果上一樣，
 * 而後者會讓這道檢查在誤設路徑時安靜地變嚴或變寬。
 */
export function readExceptions(exceptionsPath) {
  if (!existsSync(exceptionsPath)) {
    throw new Error(`讀不到行高例外清單 ${exceptionsPath}；沒有例外就放一個只有註解的空檔。`);
  }
  return readFileSync(exceptionsPath, 'utf8')
    .split('\n')
    .map((line) => line.split('#')[0].trim())
    .filter(Boolean)
    .map((line) => {
      const [file, value, ...why] = line.split('\t').map((part) => part.trim());
      if (!file || !value) throw new Error(`行高例外清單格式錯誤（要 路徑<TAB>值<TAB>理由）：${line}`);
      return { file, value, why: why.join(' ') };
    });
}

export function checkProseTypography({ root = 'src', exceptionsPath }) {
  if (!exceptionsPath) throw new Error('prose-typography：缺少 exceptionsPath');
  const exceptions = readExceptions(exceptionsPath);
  const allowed = (file, value) =>
    SCALE.has(value) || exceptions.some((e) => e.file === file && e.value === value);

  const files = walk(root).filter((f) => /\.(jsx?|mdx)$/.test(f));
  const problems = [];
  const used = new Set();
  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const [, value] of line.matchAll(/leading-\[([0-9.]+)\]/g)) {
        used.add(value);
        if (!allowed(file, value)) problems.push(`${file}:${i + 1} leading-[${value}]`);
      }
    });
  }
  return { problems, used, checked: files.length, exceptions };
}

/** 各倉的閘照這支跑。 */
export function runProseTypography(opts) {
  const { problems, used, checked, exceptions } = checkProseTypography(opts);
  if (checked === 0) {
    console.error(`正文行高檢查一個檔案都沒讀到（掃描根 ${opts.root ?? 'src'}），檢查沒有實際執行。`);
    process.exit(1);
  }
  if (problems.length > 0) {
    console.error('正文行高不在設計系統的級距裡：');
    for (const p of problems) console.error(`  ${p}`);
    console.error('\n可用的值：');
    for (const [v, why] of SCALE) console.error(`  leading-[${v}] — ${why}`);
    console.error('\n→ 改用上列其中一個；真的需要新的值就先改 DESIGN.md 與共用層的 SCALE，');
    console.error(`  只此一處的例外寫進 ${opts.exceptionsPath} 並寫明理由。`);
    process.exit(1);
  }
  console.log(
    `正文行高檢查通過：${checked} 個檔案，用到 ${used.size} 個值`
    + `（${[...used].sort().join('、') || '無'}），例外 ${exceptions.length} 筆。`,
  );
}

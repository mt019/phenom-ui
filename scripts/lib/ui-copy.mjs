// 介面文案的固定檢查——站群唯一一份。
//
// 兩件事：禁語（行銷腔、內容農場腔、站主逐次點名的詞），以及首頁卡片那行 desc 的長度上限。
// 註解不算——比對前先把註解去掉，所以抓到的一定是會印出來的字串。
import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN = [
  ['假對話式導覽', /這裡只回答一件事/g],
  ['糾正式導覽', /不用翻[^。\n]*[。]/g],
  ['危機式導覽', /別被[^。\n]*藏住/g],
  ['產品格言', /有缺口就講出來/g],
  ['產品格言', /看起來完整的清單/g],
  ['空泛強調', /真正選中的東西/g],
  ['空泛強調', /真正重要的是/g],
  ['無具體資訊的保證', /可以放心[。！]?/g],
  // 以下這批是「站在賣東西的位置介紹自己」的文案：把實際內容換成抽象名詞，
  // 再用一個空間比喻兜起來。要寫這一格有什麼，就直接寫那幾件東西的名字。
  ['把內容說成地圖', /(研究|現況|成果|議題|知識)地圖/g],
  ['把網站說成場域', /(互動)?(實驗場|體驗場|知識殿堂)/g],
  ['行銷語氣的形容', /可操作的(資料|研究|知識)/g],
  ['內容農場式標題', /前世今生/g],
  ['行銷套語', /一站式|全方位|沉浸式|賦能|助力|一應俱全/g],
  // 2026-07-29 使用者指定的禁語。「圈子」把一群人講成一個有邊界的東西，實際要說的是
  // 哪一種讀者；「來吵」把使用者回報講成一個帶脾氣的動作。兩個都寫它實際是什麼就好。
  // 「撞上」把讀者遇到一個問題寫成撞到東西（2026-07-29 使用者明令）。直接寫他會發現什麼。
  ['指定禁語', /圈子|來吵|撞上/g],
  // 2026-08-02 使用者指定：把工具擬人化的「咬」（檢查咬到、負向測試咬合）、把爭論說成
  // 「吵」（學界吵了二十年）。工具沒有牙齒，學者也不是在吵架——寫它實際做了什麼、
  // 爭的是什麼。字面用法放行：歌唱的咬字、引文裡的爭吵吵鬧。
  ['把工具擬人化的咬', /(?<!歌唱|義大利文|原書關於)咬(?!字)/g],
  ['把爭論說成吵', /吵(?!架|鬧|雜)|爭吵/g],
  // 翻轉揭曉：先立一個假想再推翻它（「本來以為只是方便。後來發現不是。」）。第二拍
  // 沒有內容，只負責製造轉折，而那個假想通常是編的。直接寫真正的差別在哪。
  ['翻轉揭曉', /(後來|結果)(才)?(發現|知道|明白)不是[。！？]/g],
  ['翻轉揭曉', /(本來|原本|一開始|起初)以為[^。\n]{0,50}[。][^。\n]{0,15}(其實|後來|結果)/g],
  // 把一件工作說成「一條線」。前面接數量詞或「字」的是門檻的字面意思（「一百二十字這條線」），
  // 不在此限。
  ['把工作說成一條線', /(?<![0-9〇一二三四五六七八九十百千萬字數])(這|那|整|同一)條線/g],
];

/*
 * 作業語言不准出現在畫面上（站群硬規則）。
 *
 * 「資料層尚未同步」「資料倉 xxx-data」這種話講的是我怎麼做事，不是讀者要知道的事。
 * 空狀態最容易中招：寫「找不到（資料層尚未同步）」而不是「目前沒有」。
 */
const ENGINEERING_WORDS = [
  ['作業語言', /資料倉/g],
  ['作業語言', /資料層/g],
  ['作業語言', /同步過來的快照/g],
  // 資料倉目錄名逐個列，不用通則式的 `*-data`——英文正文裡的 fiscal-data、tax-data
  // 是真的在講財政資料，不是倉庫名。`phenom-*-data` 帶前綴，不會誤傷，所以用通則。
  ['資料倉名', /\b(?:[a-z][a-z0-9-]*-research-data|phenom-[a-z0-9-]+-data|brief-data|vocal-training-data|statistics-lab-data|jirs-foreign-law|intl-tax-ops-lab)\b/g],
];

const EXTENSIONS = new Set(['.jsx', '.tsx']);

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesIn(file);
    return EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

function withoutComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 整行註解，以及跟在程式碼後面的行末註解。`[^:\w]` 那個條件是為了不要把
    // `https://` 當成註解起點切掉半個網址。
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/([^:\w])\/\/.*$/gm, '$1');
}

/*
 * 首頁卡片的一行文案不准變成 SEO 描述那種長句。
 *
 * PAGE_META 的 `desc` 同時餵首頁卡片與 <meta name=description>，於是有人為了 SEO 把它寫成
 * 兩百字的事實密集句，首頁那張卡就變成一大段話。兩者用途不同：卡片要一眼掃過，描述要能被
 * 答案引擎整段引用。分法是 `desc` 留給卡片、長描述寫在 `seoDesc`。
 */
function checkPageMeta({ appPath, descMax }) {
  if (!appPath) return [];
  if (!fs.existsSync(appPath)) throw new Error(`讀不到 ${appPath}；appPath 給錯了，或該站沒有 PAGE_META（就別傳這個參數）。`);
  const appSource = fs.readFileSync(appPath, 'utf8');
  const start = appSource.indexOf('const PAGE_META');
  const end = appSource.indexOf('const HOME_VARS');
  if (start === -1 || end === -1) {
    throw new Error(`${appPath} 找不到 PAGE_META 或 HOME_VARS 區塊；區塊改名了就要改這裡的判準。`);
  }
  const metaBlock = appSource.slice(start, end);
  const failures = [];
  let currentEntry = null;
  for (const line of metaBlock.split('\n')) {
    const entry = line.match(/^ {2}(\w+): \{/);
    if (entry) currentEntry = entry[1];
    const desc = line.match(/^ {4}desc: '(.*)',$/);
    if (!desc) continue;
    const length = [...desc[1]].length;
    if (length > descMax) {
      failures.push(
        `${appPath} PAGE_META.${currentEntry} 的 desc ${length} 字，超過 ${descMax}：`
        + `首頁卡片放不下這麼長的一段。把長版搬去 seoDesc，desc 留一行掃得完的話。`,
      );
    }
  }
  return failures;
}

/**
 * @param {object} opts
 * @param {string} [opts.root]     掃描根，預設 src
 * @param {string} [opts.appPath]  帶 PAGE_META 的檔；沒有就不查那一段
 * @param {number} [opts.descMax]  首頁卡片 desc 的字數上限
 */
export function checkUiCopy({ root = 'src', appPath = null, descMax = 60 } = {}) {
  const files = filesIn(path.resolve(root));
  const failures = [];
  for (const file of files) {
    const source = withoutComments(fs.readFileSync(file, 'utf8'));
    for (const [label, pattern] of [...FORBIDDEN, ...ENGINEERING_WORDS]) {
      for (const match of source.matchAll(pattern)) {
        const line = source.slice(0, match.index).split('\n').length;
        failures.push(`${path.relative(process.cwd(), file)}:${line} ${label}：${match[0]}`);
      }
    }
  }
  failures.push(...checkPageMeta({ appPath, descMax }));
  return { failures, checked: files.length };
}

/** 各倉的閘照這支跑。 */
export function runUiCopy(opts) {
  const { failures, checked } = checkUiCopy(opts);
  if (checked === 0) {
    console.error(`介面文案檢查一個檔案都沒讀到（掃描根 ${opts?.root ?? 'src'}），檢查沒有實際執行。`);
    process.exit(1);
  }
  if (failures.length) {
    console.error(`介面文案檢查失敗：\n${failures.join('\n')}`);
    process.exit(1);
  }
  console.log(`介面文案檢查通過：${checked} 個前端檔案。`);
}

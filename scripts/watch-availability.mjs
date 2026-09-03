// 站群週期性存活檢查。既有的 smoke-* 只在部署當下跑，而且要求指定確切的 commit，
// 排程沒有 inputs 給不了那兩個 SHA，所以健康檢查另立一支：不釘版本，只問「現在還通不通」。
// 2026-08-12 盤點時站群一支週期性檢查都沒有，任何一站掛掉都要等人自己發現。
//
// 2026-09-03 自 phenom-ops 搬來：phenom-ops 是私有倉，Actions 分鐘要計費，本倉公開、分鐘為零，
// 排程因此得以恢復每小時。站點名冊仍以 phenom-ops 的 infra/sites.json 為母本，執行時用
// ACTIONS_QUOTA_TOKEN 打 contents API 拉，本倉不留抄本——抄本改一邊就會漂移。
//
// 判準看內容不看狀態碼：Cloudflare 與來源站故障時回 200 加一頁錯誤 HTML 的情形已經遇過
// （見 phenom-court-data/engineering/scripts/watch-court-availability.mjs 的同一條註記）。
//
// 退出碼：0＝站群全通，1＝至少一站不通或名冊拉不到。上游來源（憲法法庭官網）只回報
// 不計入退出碼——它斷線不是我們的故障，若計入，官網斷的每一輪都會發一次通知。

const REGISTRY_URL = 'https://api.github.com/repos/mt019/phenom-ops/contents/infra/sites.json';
const token = process.env.ACTIONS_QUOTA_TOKEN;
if (!token) {
  console.error('缺 ACTIONS_QUOTA_TOKEN，拉不到 phenom-ops 母本 sites.json。');
  process.exit(1);
}

let registry;
try {
  const response = await fetch(REGISTRY_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    console.error(`拉母本 sites.json 失敗：HTTP ${response.status}（${REGISTRY_URL}）`);
    process.exit(1);
  }
  registry = JSON.parse(await response.text());
} catch (error) {
  console.error(`拉母本 sites.json 失敗：${error.name} ${error.message}`);
  process.exit(1);
}

// 上游一手來源。這批文件只有官網有，斷線起訖要有紀錄才答得出「斷了多久」。
const UPSTREAM = [
  { 名稱: '憲法法庭官網首頁', url: 'https://cons.judicial.gov.tw/', 期望: (text) => /憲法法庭|司法院/.test(text) },
  { 名稱: '憲法法庭下載端點', url: 'https://cons.judicial.gov.tw/download/download.aspx?id=280977', 期望: (text) => text.startsWith('%PDF-') },
];

async function probe({ 名稱, url, 期望 }) {
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
    const buffer = Buffer.from(await response.arrayBuffer());
    const head = buffer.subarray(0, 4096).toString('latin1');
    const text = head.startsWith('%PDF-') ? head : buffer.subarray(0, 20000).toString('utf8');
    return { 名稱, url, 狀態碼: response.status, 位元組: buffer.length, 合格: response.ok && 期望(text, buffer), 毫秒: Date.now() - started };
  } catch (error) {
    return { 名稱, url, 狀態碼: null, 位元組: 0, 合格: false, 錯誤: error.name, 毫秒: Date.now() - started };
  }
}

// 只量 status: live 的站。planned／maintenance 的主機名刻意還沒指向任何地方（實測
// canvas、mandarin、iias 都無 DNS 紀錄），把它們算進來等於每一輪都固定失敗一次。
// 納管範圍因此隨 infra/sites.json 自動變動，不必另外維護一張清單。
const 站群探測 = registry.sites
  .filter((site) => site.status === 'live')
  .map((site) => {
    const path = site.smokePaths?.[0] ?? '/';
    // notes 掛在 apex 的子路徑（canonicalBase 含 /notes），所以取 origin 再接 smokePath，
    // 不能把兩者直接串起來——那會產出 /notes/notes/。
    const origin = new URL(site.canonicalBase ?? `https://${site.hostname}`).origin;
    return {
      名稱: site.id,
      url: `${origin}${path}`,
      // 空殼與錯誤頁都短；正常頁面在 prerender 之後一律遠超這個長度。
      期望: (text) => text.length > 500,
    };
  });

const 站群 = [];
for (const item of 站群探測) 站群.push(await probe(item));
const 上游 = [];
for (const item of UPSTREAM) 上游.push(await probe(item));

const line = (r) => `${r.合格 ? '通' : '不通'}｜${r.名稱}｜${r.狀態碼 ?? r.錯誤}｜${r.位元組} bytes｜${r.毫秒} ms｜${r.url}`;
console.log('站群：');
for (const r of 站群) console.log(`  ${line(r)}`);
console.log('上游一手來源（不計入退出碼）：');
for (const r of 上游) console.log(`  ${line(r)}`);

const 壞掉 = 站群.filter((r) => !r.合格);
console.log(`\n${new Date().toISOString()}｜站群 ${站群.length - 壞掉.length}/${站群.length} 通｜上游 ${上游.filter((r) => r.合格).length}/${上游.length} 通`);
if (壞掉.length) {
  console.error(`不通：${壞掉.map((r) => r.名稱).join('、')}`);
  process.exit(1);
}

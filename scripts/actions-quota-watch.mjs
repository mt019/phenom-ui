// GitHub Actions 額度看守。私有倉的 Actions 分鐘每月免費額 2,000 分，2026-08 曾用到
// 2,967 分把全帳號停擺 27 小時。本腳本每 6 小時量一次本月已用分鐘，過門檻就在本倉開 issue。
//
// 主路：enhanced billing 的 usage 端點（GET /users/mt019/settings/billing/usage）。
// 舊的 /settings/billing/actions 一族端點 GitHub 已於 2025 年關閉（org 版實測回 410），
// 不要退回去用它。usage 端點按日曆月過濾，與帳單週期的起訖有小落差，輸出裡註明。
//
// 退回路（主路 403/404/410 時）：照 phenom-ops/scripts/actions-usage.sh 的算法——
// 列出帳號全部私有倉、逐倉取 run 清單、加總本日曆月內的 updatedAt - createdAt。
// 這是牆鐘時間，計費另按每個 job 進位到分，對短 job 為主的用量會系統性偏低。
// 校準係數：待 PAT 建好後照驗收第 1 步「同一時點主路對退回路」實測補進這行註解。
//
// 門檻推導：免費額 2,000 分 × 70% = 1400（警戒）、× 90% = 1800（臨界）。
// 額度方案改變時要跟著改的就是下面 THRESHOLDS 這一行。
//
// 需要的環境變數：
//   ACTIONS_QUOTA_TOKEN — fine-grained PAT（Plan: Read、Actions: Read、Contents: Read）
//   GITHUB_TOKEN        — workflow 內建 token，開 issue 用（issues: write）
//   GITHUB_REPOSITORY   — 開 issue 的落點，預設 mt019/phenom-ui
// 旗標：--dry-run 印出會開什麼 issue 而不開。

const USER = 'mt019';
const FREE_MINUTES = 2000;
const THRESHOLDS = [
  { level: '臨界', minutes: Math.round(FREE_MINUTES * 0.9) }, // 1800
  { level: '警戒', minutes: Math.round(FREE_MINUTES * 0.7) }, // 1400
];
const RUN_LIST_LIMIT = 1000;
const LABEL = 'actions-quota';

const dryRun = process.argv.includes('--dry-run');
const quotaToken = process.env.ACTIONS_QUOTA_TOKEN;
const issueToken = process.env.GITHUB_TOKEN ?? quotaToken;
const issueRepo = process.env.GITHUB_REPOSITORY ?? 'mt019/phenom-ui';

if (!quotaToken) {
  console.error('缺 ACTIONS_QUOTA_TOKEN，量不了額度。');
  process.exit(1);
}

async function gh(path, { token = quotaToken, method = 'GET', body } = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  return response;
}

const now = new Date();
const year = now.getUTCFullYear();
const month = now.getUTCMonth() + 1;
const monthTag = `${year}-${String(month).padStart(2, '0')}`;

// 主路：usage API。
async function usageFromBillingApi() {
  const response = await gh(`/users/${USER}/settings/billing/usage?year=${year}&month=${month}`);
  if (!response.ok) {
    console.error(`usage 端點回 HTTP ${response.status}，改走退回路。`);
    return null;
  }
  const data = await response.json();
  const items = (data.usageItems ?? []).filter((item) => item.product === 'actions');
  let minutes = 0;
  const unitTypes = new Set();
  for (const item of items) {
    unitTypes.add(item.unitType);
    minutes += item.quantity ?? 0;
  }
  const notes = [];
  if (unitTypes.size && ![...unitTypes].every((unit) => /minute/i.test(unit ?? ''))) {
    notes.push(`unitType 不全是 minutes（實際：${[...unitTypes].join('、')}），加總的單位要人工核一次`);
  }
  notes.push('usage 端點按日曆月過濾，與帳單週期起訖有小落差');
  return { minutes: Math.round(minutes), source: `usage API（${monthTag}）`, notes, reposVisited: null };
}

// 退回路：逐私有倉加總本日曆月的 run 牆鐘。
async function usageFromRunLists() {
  const repos = [];
  for (let page = 1; page <= 5; page += 1) {
    const response = await gh(`/user/repos?visibility=private&affiliation=owner&per_page=100&page=${page}`);
    if (!response.ok) {
      console.error(`列私有倉失敗：HTTP ${response.status}`);
      process.exit(1);
    }
    const batch = await response.json();
    repos.push(...batch.map((repo) => repo.full_name));
    if (batch.length < 100) break;
  }
  if (repos.length === 0) {
    console.error('走訪到 0 個私有倉：token 看不到私有倉，或列表被過濾成空。這個數字不能當額度用。');
    process.exit(1);
  }
  const monthStart = `${monthTag}-01`;
  const notes = ['退回路是牆鐘估算，計費另按每個 job 進位到分，對短 job 為主的用量系統性偏低'];
  let minutes = 0;
  for (const repo of repos) {
    let fetched = 0;
    for (let page = 1; fetched < RUN_LIST_LIMIT; page += 1) {
      const response = await gh(`/repos/${repo}/actions/runs?created=%3E%3D${monthStart}&per_page=100&page=${page}`);
      if (!response.ok) {
        console.error(`取 ${repo} 的 run 清單失敗：HTTP ${response.status}`);
        break;
      }
      const data = await response.json();
      const runs = data.workflow_runs ?? [];
      for (const run of runs) {
        minutes += (new Date(run.updated_at) - new Date(run.created_at)) / 60000;
      }
      fetched += runs.length;
      if (runs.length < 100) break;
      if (fetched >= RUN_LIST_LIMIT) {
        const warning = `${repo} 取到 ${RUN_LIST_LIMIT} 筆上限，更早的執行沒有算進來`;
        console.error(`警告：${warning}`);
        notes.push(warning);
      }
    }
  }
  return { minutes: Math.round(minutes), source: `退回路（逐倉 run 牆鐘，${monthTag}）`, notes, reposVisited: repos.length };
}

async function findOpenIssue(title) {
  const q = encodeURIComponent(`repo:${issueRepo} is:issue is:open label:${LABEL} in:title "${title}"`);
  const response = await gh(`/search/issues?q=${q}`, { token: issueToken });
  if (!response.ok) return null;
  const data = await response.json();
  return (data.items ?? []).find((item) => item.title === title) ?? null;
}

async function ensureLabel() {
  const probe = await gh(`/repos/${issueRepo}/labels/${LABEL}`, { token: issueToken });
  if (probe.ok) return;
  const created = await gh(`/repos/${issueRepo}/labels`, {
    token: issueToken,
    method: 'POST',
    body: { name: LABEL, color: 'b60205', description: 'Actions 分鐘數過門檻的看守通知' },
  });
  if (!created.ok) console.error(`建 label ${LABEL} 失敗：HTTP ${created.status}（開 issue 可能跟著失敗）`);
}

const usage = (await usageFromBillingApi()) ?? (await usageFromRunLists());

console.log(`本月（${monthTag}）Actions 已用約 ${usage.minutes} 分`);
console.log(`資料來源：${usage.source}`);
if (usage.reposVisited !== null) console.log(`走訪私有倉數：${usage.reposVisited}`);
for (const note of usage.notes) console.log(`註：${note}`);

const hit = THRESHOLDS.find((threshold) => usage.minutes >= threshold.minutes);
if (!hit) {
  console.log(`未過警戒門檻（${THRESHOLDS[1].minutes} 分）。`);
  process.exit(0);
}

const title = `Actions 額度${hit.level}：${monthTag} 已用 ${usage.minutes} 分`;
const dedupeTitlePrefix = `Actions 額度${hit.level}：${monthTag}`;
const body = [
  `本月（${monthTag}）Actions 已用約 ${usage.minutes} 分，過了${hit.level}門檻 ${hit.minutes} 分（免費額 ${FREE_MINUTES} 分）。`,
  `資料來源：${usage.source}`,
  ...usage.notes.map((note) => `註：${note}`),
  `量測時間：${now.toISOString()}`,
].join('\n\n');

if (dryRun) {
  console.log(`--dry-run：會開 issue「${title}」（label ${LABEL}，落點 ${issueRepo}），內文：\n${body}`);
  process.exit(0);
}

// 同月同級已有 open issue 就不重開。
const q = encodeURIComponent(`repo:${issueRepo} is:issue is:open label:${LABEL} "${dedupeTitlePrefix}"`);
const searchResponse = await gh(`/search/issues?q=${q}`, { token: issueToken });
if (searchResponse.ok) {
  const existing = (await searchResponse.json()).items?.find((item) => item.title.startsWith(dedupeTitlePrefix));
  if (existing) {
    console.log(`同月同級的 issue 已開著（#${existing.number}），不重開。`);
    process.exit(0);
  }
} else {
  console.error(`查既有 issue 失敗：HTTP ${searchResponse.status}，為免重複通知，本輪不開 issue。`);
  process.exit(1);
}

await ensureLabel();
const created = await gh(`/repos/${issueRepo}/issues`, {
  token: issueToken,
  method: 'POST',
  body: { title, body, labels: [LABEL] },
});
if (!created.ok) {
  console.error(`開 issue 失敗：HTTP ${created.status} ${await created.text()}`);
  process.exit(1);
}
console.log(`已開 issue：${(await created.json()).html_url}`);

// 相容主題（v0.1.31）的字型網址判定，stage-core.mjs 用。
//
// 相容主題的 woff2 與目前 src/fonts-external.css 指向的外部檔 sha256 相同時，直接用外部檔網址。
// 不同時（目前的字型補過字，內容已改），改指相容主題自己那個 sha 的內容定址網址：
// assets.phenomcanvas.com 的 key 是 v1/<sha256>/fonts/<名>，舊版檔案上傳後不刪。寫入前以 HEAD
// 回讀，狀態不是 200 或長度與相容主題的檔案不同就中止，不寫出一個指向不存在檔案的網址。

export const ASSET_ORIGIN = 'https://assets.phenomcanvas.com';

export async function headStatus(url) {
  const response = await fetch(url, {
    method: 'HEAD',
    cache: 'no-store',
    signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, length: Number(response.headers.get('content-length') ?? -1) };
}

export async function resolveLegacyFontUrl({
  name,
  legacySha,
  legacyBytes,
  external,
  head = headStatus,
}) {
  if (!external) throw new Error(`相容主題字型 ${name} 在 src/fonts-external.css 沒有同名的外部檔`);
  if (legacySha === external.sha256) return { url: external.url, source: 'external' };
  const url = `${ASSET_ORIGIN}/v1/${legacySha}/fonts/${name}`;
  const result = await head(url);
  if (result.status !== 200)
    throw new Error(
      `相容主題字型 ${name} 的 sha256 與外部檔不同，舊網址 HEAD 回 ${result.status}，不能改指：${url}`,
    );
  if (legacyBytes !== undefined && result.length !== legacyBytes)
    throw new Error(
      `相容主題字型 ${name} 的舊網址 content-length ${result.length}，相容主題檔 ${legacyBytes} bytes：${url}`,
    );
  return { url, source: 'legacy-sha' };
}

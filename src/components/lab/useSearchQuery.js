import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/*
 * 檢索關鍵字與網址查詢字串（預設 ?q=）同步的共用邏輯。原本兩個站各寫一份：
 * phenom-zhujiahua 的 SearchPage 用本地 state 打字、debounce 寫回網址；phenom-tax 的
 * SearchPage 與 HeaderSearch 反過來，讀網址驅動畫面、掛載後才讀第一次。
 *
 * 預先渲染的頁面沒有查詢字串；第一次渲染若照網址畫，會跟伺服器給的那一份對不上，
 * 被整棵樹丟掉重畫（React 錯誤代碼 418／423，畫面看起來正常，只在主控台看得到）。
 * 掛載前一律回傳空字串，掛載完成才讀。
 *
 * 兩種用法，由 `live` 切換：
 * - `live: true`：回傳值一律反映網址目前的值，網址在別處被改動（導覽、上一頁）也會
 *   跟著更新；不寫回網址。給唯讀的顯示，或另有自己的提交邏輯的輸入框用（頁首常駐框、
 *   結果頁本身）。
 * - `live: false`（預設）：掛載時讀一次網址當初始值，之後改動只在本地，經
 *   `debounceMs` 毫秒後才寫回網址（用 replace，不逐字推進瀏覽紀錄）。給即時檢索框用，
 *   使用者打字當下就看得到自己剛打的字，不必等寫回網址那一輪 render。
 *
 * 回傳 `[value, setValue, mounted]`；`live` 模式下 `setValue` 不寫回網址，只在下一次
 * 網址改動前暫時生效，一般不需要呼叫它。
 */
export function useSearchQuery(param = 'q', { debounceMs = 500, live = false } = {}) {
  const [params, setParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState('');
  const initedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (live) { setValue(params.get(param) ?? ''); return; }
    if (initedRef.current) return;
    initedRef.current = true;
    setValue(params.get(param) ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, live, params, param]);

  useEffect(() => {
    if (!mounted || live || debounceMs <= 0) return undefined;
    const timer = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value.trim()) next.set(param, value.trim());
        else next.delete(param);
        return next;
      }, { replace: true });
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, mounted, live, debounceMs, param, setParams]);

  return [value, setValue, mounted];
}

export default useSearchQuery;

import { createRoot, hydrateRoot } from 'react-dom/client';

/*
 * 掛載入口：建置產物有預先渲染的內容就接手它，開發伺服器給的是空殼就自己畫。
 *
 * vite 的開發伺服器送出的是倉裡那份 index.html，`#root` 是空的；render-static
 * 只在建置時把預先渲染的 HTML 塞進去。兩邊共用同一支 main.jsx，於是每次開發時載入
 * 頁面，React 都會報一次水合不一致，接著整棵樹改由瀏覽器重畫。訊息本身沒有指出成因，
 * 讀到的人會去找頁面元件哪裡寫錯。
 *
 * 產物裡的 `#root` 是空的則是另一回事：那表示預先渲染沒有把這一頁寫進去，讀者拿到的
 * 頁面靠瀏覽器補上，搜尋引擎拿到的是空殼。這裡不擲錯——擲了讀者就是一片白——改為在
 * 主控台印一行，逐頁的驗收留給各站建置端的 validate-build。
 *
 * 判斷用 firstElementChild：預先渲染寫進去的一定是元素，而 index.html 那個 div
 * 連空白文字節點都沒有。
 */
export function hasPrerenderedMarkup(container) {
  return Boolean(container && container.firstElementChild);
}

export function mountApp(element, options = {}) {
  const container = options.container ?? document.getElementById('root');
  if (!container) throw new Error('mountApp：找不到掛載節點 #root');

  if (hasPrerenderedMarkup(container)) return hydrateRoot(container, element);

  if (!import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.error('mountApp：這一頁的 #root 沒有預先渲染的內容，改由瀏覽器渲染');
  }
  const root = createRoot(container);
  root.render(element);
  return root;
}

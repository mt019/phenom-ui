# @phenomcanvas/ui

Phenom 網站群的版本化共用層。這個 package 收：

- design tokens、色票、紙紋與 Tailwind preset；
- 共用網站殼、導覽、閱讀控制與 UI primitives；
- SEO metadata helper；
- 完整共用 web fonts 與來源／授權紀錄；
- 無業務語意的 design validators。

研究資料、站點 schema、站點文案與產品專用元件不進本倉。

Consumer 必須鎖定 release tag，不追浮動 `main`：

```json
{
  "dependencies": {
    "@phenomcanvas/ui": "github:mt019/phenom-ui#v0.1.0"
  }
}
```

Tailwind consumer 同時套用 preset，並掃描 package 原始碼：

```js
import phenomPreset from '@phenomcanvas/ui/tailwind-preset';

export default {
  presets: [phenomPreset],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@phenomcanvas/ui/src/**/*.{js,jsx}',
  ],
};
```

入口 CSS：

```js
import '@phenomcanvas/ui/styles.css';
```

字型檔隨 package 發布，`styles.css` 以相對 URL 引用，由 consumer bundler
轉成自己的不可變資產。

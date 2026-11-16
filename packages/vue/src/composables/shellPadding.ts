// 與 React 版 src/components/shellPadding.js 逐字一致的外殼水平內距。
// 手機與平板不加內距，留白只從 lg 起長，xl 再長一階。

/** 預設：單一內容欄的殼。 */
export const SHELL_PAD_X = 'px-4 sm:px-6 lg:px-16 xl:px-24';
/** 已有側欄擋在內容與螢幕邊之間的殼，留一半。 */
export const SHELL_PAD_X_RAIL = 'px-4 sm:px-6 lg:px-10 xl:px-16';
/** 例外：整欄是寬表格、橫向不夠用的頁面。 */
export const SHELL_PAD_X_TIGHT = 'px-4 sm:px-6';

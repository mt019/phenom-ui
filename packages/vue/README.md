# Phenom Vue shared layer

This package is a separate Vue consumer entry, with no React peer dependency.
The existing React package remains unchanged during fleet adoption.

Components use Vue SFCs, typed props and slots. Composables hold reading scale
and URL state; Vue Router handles navigation/back semantics. ArticleLayout and
DashboardLayout retain the existing geometry and DOM classes. They scan rendered
headings, track the active section and expose desktop rails through mobile
drawers. Drawer scroll locks, Escape handling, focus restoration and observer
cleanup belong to the shared package.

SiteHeader, BackLink, PageIdentity, AppearanceMenu, Dropdown, FilterBar,
SectionLink, ArticleMeta, ArticleNav, Prose and AnnotatedHtml cover the Notes
reading interface. VNode-valued layout props and default slots are supported
without extra wrappers. FontSizeControl supports modelValue/update:modelValue
and the existing scale/onChange contract. AnnotatedHtml accepts trusted,
build-rendered HTML; it does not sanitize arbitrary user input. Notes remain
numbered by the content build; runtime citation registries for MDX consumers
are outside this release. PageShell retains the standalone page frame and
ScrollToTop handles navigation between pages.

Version 0.3 adds the controls consumed by the Judicial migration candidate:
RailLayout, PdfViewer, SearchField, Tabs, Accordion/AccordionItem,
useExpandedSet and FacetFilterBar. RailLayout and Tabs preserve the v0.1.31
layout and tab variants. PdfViewer embeds the supplied public URL, retaining
new-tab opening, random selection and related-document buttons; it restores
focus and the previous body scroll setting on close. FacetFilterBar only
renders supplied facets, counts and selected sets. Domain filtering, legal term
rows, quiz rules and data access remain consumer responsibilities.

## 0.4：studies 四站所用的目次、浮卡與公式元件

0.4 加入 guzhun、chenyinke、xiaozhuanling、zhujiahua 四站遷移所需的 BookTree、HoverCard、Math，並把 0.3 已有的 MathText 列入匯出表。props 名稱與 React 正本相同；React 版以函式 prop 傳入的回呼（如 onSelect），Vue 版寫 `:on-select` 或 `@select` 皆可。

| 元件 | React 正本 | 介面與行為 |
|---|---|---|
| BookTree | phenom-guzhun `src/components/lab/BookTree.jsx` | 整本書的目次，放進 ArticleLayout 的 `nav`。items 由呼叫端攤平為 `{ id, title, href, group, subgroup?, lead?, badge?, hint? }`，照書的順序排好；相鄰同名的 group、subgroup 併為一段。傳 onSelect 時每篇是按鈕，否則是 RouterLink。header 用 prop 或 `header` slot 傳入。分組、搜尋與捲動定位寫在 `bookTree.js`。zhujiahua 那份與 guzhun 只差 SearchField 的匯入來源，功能相同。 |
| HoverCard | phenom-ui 根目錄 `src/components/lab/HoverCard.jsx` | 包住一段文字的浮卡：滑過或聚焦時開啟，點擊固定，按 Esc 或點卡外關閉，同時只開一張。正文用 default slot，卡片內容用 `card` prop 或 `card` slot。開啟期間在 document 掛 keydown、pointerdown，在 window 掛 scroll（capture）與 resize，關閉與卸載時移除。定位計算寫在 `floatingCard.js`。 |
| Math | 各站 `src/components/lab/Math.jsx` | `tex`、`display`、`className`。display 為 true 時輸出以 div 包住的區塊公式，否則以 span 包住的行內公式；KaTeX 選項與 React 版相同，見 `mathRender.js` 的 renderFormula。匯出名 Math 會遮蔽所在模組的全域 Math，該模組另用到 Math.max 之類時，改寫 `import { Math as Formula }`。 |
| MathText | 各站 `src/components/lab/MathText.jsx` | 字串由 `text` prop 傳入；React 版由 children 傳入。 |

AnnotatedHtml 處理建置時產生、帶 `data-note`／`data-term` 屬性的 HTML，卡片欄位固定為註釋與術語兩種。HoverCard 包住呼叫端自己組的節點，卡片內容也由呼叫端提供，chenyinke 正文裡的人名卡屬於這種用法。AnnotatedHtml 未涵蓋這種用法，兩個元件因此並存。

根目錄 `npm test` 含兩支 ui-vue 測試：`tests/vue-ssr.test.mjs` 在不載入 DOM 的情況下以 renderToString 渲染，`tests/vue-mount.test.mjs` 以 happy-dom 掛載、操作，並計數卸載後殘留在 document 與 window 的監聽器。兩支從 `packages/vue/node_modules` 取 vue、vue-router、katex、lucide-vue-next、happy-dom，版本固定在本套件的 devDependencies；跑之前先在 `packages/vue` 下 `npm ci`，Node 用 22.23.4。

Notes uses the reviewed 0.2 package. Judicial targets the 0.3 candidate; its
consumer acceptance remains pending until the exact installed tarball passes
its type check, route/content checks and desktop/mobile browser checks. A direct
source type check with mapped dependencies does not establish that the packed
consumer passes.

Design sources have one editable home: the existing repository root `src/` and
`tailwind-preset.js`. `npm pack` runs scripts/stage-core.mjs, copying those exact
files into ignored generated core/ and recording source hashes. Never edit core/
or treat it as an independent theme. The font CSS and URLs remain unchanged.

For Judicial parity, staging also produces core/legacy/v0.1.31 from that exact
Git tag: CSS, tokens, marks, font declarations, font metadata and Tailwind preset.
These generated files have no separate editable source. Judicial selects the
legacy entry explicitly; the default styles and Notes theme remain unchanged.
A later theme upgrade needs its own visual acceptance. Since 0.4.2 the legacy
fonts are not bundled: staging verifies that each v0.1.31 woff2 is byte-identical
(sha256) to the content-addressed file on assets.phenomcanvas.com and rewrites
the legacy styles.css urls to those files, which cut the tarball from 12.9 MB to
under 1 MB. The legacy entry is scheduled to leave the package at 1.0.

Consumers import styles from @phenomcanvas/ui-vue/styles.css, use the package's
Tailwind preset, and include its src/**/*.vue and src/**/*.ts in Tailwind content.
Pin both the package release and its lockfile. During this isolated first release,
use the reviewed tarball rather than an unpublished package name from npm.

useFontScale restores canvaslab:fontScale after mount, preserves the seven
existing levels, tolerates blocked storage, synchronizes instances/tabs, and
removes listeners with the owning Vue scope. useTabParams preserves unrelated
query/hash values, removes defaults from the URL, and patches dimensions in one
router navigation. Router scroll behavior must not globally reset scrolling;
callers explicitly request top or preserve per interaction.

Every consumer still needs full route, mobile, SEO, content and behavior
acceptance. This foundation package does not itself migrate a site.

Static sites that render only default query views can opt into query hydration:

```ts
import {STATIC_QUERY_HYDRATION} from '@phenomcanvas/ui-vue';
app.provide(STATIC_QUERY_HYDRATION, true);
```

Provide the key on both client and server applications for that static consumer.
On the client, useTabParams/useTabParam initially return declared defaults so
hydration matches the static HTML, then apply the actual URL query after mount.
They do not rewrite the URL. Server rendering continues to read its supplied
route normally. Dynamic SSR consumers and other applications leave this opt-in
unset and continue to read query values immediately. This is appropriate only
for default-query static HTML; it is not a way to suppress hydration warnings
for server HTML rendered from a different nondefault query.

AppearanceMenu uses a viewport-clamped popup outside scrollable rails. It keeps
right alignment where space permits and cleans up scroll, resize and dismissal
listeners when unmounted.

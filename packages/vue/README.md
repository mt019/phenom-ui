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
A later theme upgrade needs its own visual acceptance.

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

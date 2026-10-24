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
are outside this release. Other consumers must validate their own requirements.

Design sources have one editable home: the existing repository root `src/` and
`tailwind-preset.js`. `npm pack` runs scripts/stage-core.mjs, copying those exact
files into ignored generated core/ and recording source hashes. Never edit core/
or treat it as an independent theme. The font CSS and URLs remain unchanged.

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

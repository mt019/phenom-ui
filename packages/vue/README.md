# Phenom Vue shared layer

This package is a separate Vue consumer entry, with no React peer dependency.
The existing React package remains unchanged during fleet adoption.

Components use Vue SFCs, typed props, named slots and defineModel. Composables
hold reading scale and URL state; Vue Router handles navigation/back semantics.
`ReadingShell` is the initial reusable frame, not a complete replacement for the
existing ArticleLayout: mobile drawers, citation behavior and automatic headings
must be ported and accepted before migrating a consumer that needs them.

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

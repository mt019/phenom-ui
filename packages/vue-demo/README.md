# Shared Vue acceptance preview

This fixture exercises the real @phenomcanvas/ui-vue tarball. It is an isolated
component acceptance surface, not a migrated content site. Existing root CSS,
font URLs and design tokens are staged unchanged by the library's prepack step.

Use the pinned Node version in .node-version (22.23.4). This matches the current
Vue Router toolchain's Node requirement, without changing the operator's system
runtime. Install with npm ci --ignore-scripts. Run npm run build (including
vue-tsc), npm run test:ssr, and npm run preview -- --port 4192. Then run
npm run test:browser against that preview, or pass a public /vue-ui/ URL.
The browser tests deliver the exact existing font binaries from this repository
to isolate UI behavior; origin health and deployed assets need separate probes.
Screenshots and reports are written to ignored .test-evidence/ unless
VUE_UI_EVIDENCE_DIR is provided. Playwright Chromium must be installed.

node scripts/stage-preview.mjs creates ignored .preview/ with noindex headers,
immutable assets, an exact package/source manifest, and a real 404. Upload only
to the isolated preview branch. It has no production authority and should never
replace a site's normal dist artifact. Production deployment identities are
recorded before and after the preview upload in the central Ops checkpoint.

Consumer adoption must still port any missing full shell requirements (mobile
navigation, automatic headings, citations, appearance controls, SEO/SSR, and
page-specific features). Passing this fixture does not prove those features.

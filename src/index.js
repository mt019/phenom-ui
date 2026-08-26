export { default as AppearanceMenu } from './components/AppearanceMenu.jsx';
export { default as BackLink } from './components/BackLink.jsx';
export { default as BackToTop } from './components/BackToTop.jsx';
export { default as Eyebrow } from './components/Eyebrow.jsx';
export {
  default as FontSizeControl,
  FONT_SCALES,
  useFontScale,
} from './components/FontSizeControl.jsx';
export { default as LangSwitch, useLang } from './components/LangSwitch.jsx';
export { default as PageIdentity } from './components/PageIdentity.jsx';
export { default as PageShell } from './components/PageShell.jsx';
export { default as ScrollToTop } from './components/ScrollToTop.jsx';
export { mountApp, hasPrerenderedMarkup } from './mountApp.js';
export { default as SeoHead } from './components/SeoHead.jsx';
export { default as SiteHeader } from './components/SiteHeader.jsx';
export {
  SHELL_PAD_X,
  SHELL_PAD_X_RAIL,
  SHELL_PAD_X_TIGHT,
} from './components/shellPadding.js';

export { default as Accordion, AccordionItem, useExpandedSet } from './components/lab/Accordion.jsx';
export { default as ArticleLayout, ArticleNav } from './components/lab/ArticleLayout.jsx';
export { default as ArticleMeta } from './components/lab/ArticleMeta.jsx';
export { default as AnnotatedHtml } from './components/lab/AnnotatedHtml.jsx';
export { default as AnnotatedText } from './components/lab/AnnotatedText.jsx';
export { default as Badge } from './components/lab/Badge.jsx';
export { default as BookTree } from './components/lab/BookTree.jsx';
export { default as RailBrand } from './components/lab/RailBrand.jsx';
export { default as DashboardLayout } from './components/lab/DashboardLayout.jsx';
export { default as DataTable } from './components/lab/DataTable.jsx';
export { default as Derivation } from './components/lab/Derivation.jsx';
export { default as Dropdown } from './components/lab/Dropdown.jsx';
export { default as FilterBar } from './components/lab/FilterBar.jsx';
export { FigureNumbering, FigureBlock, FigureCaption, FigRef, useFigure, figureAnchorId } from './components/lab/figureNumbering.jsx';
export { default as HoverCard } from './components/lab/HoverCard.jsx';
export { default as HoverCite } from './components/lab/HoverCite.jsx';
export { CiteNumbering, createCiteRegistry, useCiteNumber } from './components/lab/citeNumbering.jsx';
export { default as NotesList } from './components/lab/NotesList.jsx';
export { default as NotesMarkdown, mdInline } from './components/lab/NotesMarkdown.jsx';
export { default as PdfViewer } from './components/lab/PdfViewer.jsx';
export { default as Prose } from './components/lab/Prose.jsx';
export { buildNotes, noteHtml, stripNotes } from './components/lab/textNotes.js';
export { default as Quiz } from './components/lab/Quiz.jsx';
export { default as RailLayout } from './components/lab/RailLayout.jsx';
export { default as SearchField } from './components/lab/SearchField.jsx';
export { default as SearchResults } from './components/lab/SearchResults.jsx';
export { default as SectionLink } from './components/lab/SectionLink.jsx';
export { default as SourceFilter, usePersistedFlag } from './components/lab/SourceFilter.jsx';
export { default as SourcesList } from './components/lab/SourcesList.jsx';
export { default as StickyHeading, useStickyTop, useStuckToTop } from './components/lab/StickyHeading.jsx';
export { default as SubOutline } from './components/lab/SubOutline.jsx';
export { default as TableOfContents } from './components/lab/TableOfContents.jsx';
export { default as useMediaQuery } from './components/lab/useMediaQuery.js';
export { default as useHeadings } from './components/lab/useHeadings.js';
export { default as Tabs, useTabParam, useTabParams } from './components/lab/Tabs.jsx';
export { default as TermLink } from './components/lab/TermLink.jsx';
export { default as MathText } from './components/lab/MathText.jsx';
export { default as ChartFrame, useFrame } from './components/lab/chart/ChartFrame.jsx';
export { Grid, AxisX, AxisY } from './components/lab/chart/Axis.jsx';
export { Bars, Line, AreaWash, Dots, RuleLine } from './components/lab/chart/marks.jsx';
export { linearScale, bandScale, niceTicks } from './components/lab/chart/scale.js';

export {
  PALETTES,
  TEXTURES,
  applySitePalette,
  applySiteTexture,
  bootSitePalette,
  getSitePaletteId,
  getSiteTextureId,
  setSitePalette,
  setSiteTexture,
} from './styles/palettes.js';

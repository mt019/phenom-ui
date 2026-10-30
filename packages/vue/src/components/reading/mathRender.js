import katex from 'katex';
/** Render trusted inline math from a note locator. */
export function renderMath(source) {
  return katex.renderToString(source, { throwOnError: false });
}

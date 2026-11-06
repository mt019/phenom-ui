import katex from 'katex';
/** Render trusted inline math from a note locator. */
export function renderMath(source) {
  return katex.renderToString(source, { throwOnError: false });
}

/** Render a formula written in a component (Math.vue); options match the React Math.jsx. */
export function renderFormula(tex, display = false) {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    output: 'htmlAndMathml',
    trust: false,
    strict: 'ignore',
  });
}

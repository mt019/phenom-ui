/*
 * 讓 node --test 直接 import packages/vue 的 .vue 與 .ts 原始檔。
 * - 裸模組名（vue、vue-router、katex、happy-dom…）一律從 packages/vue 解析，
 *   版本即 packages/vue/package.json 的 devDependencies。
 * - 不帶副檔名的相對路徑依序補 .ts、.js。
 * - .vue 以 vue/compiler-sfc 編譯成客戶端 render function（SSR 與掛載共用同一份產物），
 *   再以 node:module 的 stripTypeScriptTypes 去掉型別；.css 載成空模組。
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire, stripTypeScriptTypes } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const vueRoot = new URL('../../packages/vue/', import.meta.url);
const vueRootPath = fileURLToPath(vueRoot);
const pkgParent = new URL('package.json', vueRoot).href;
const require = createRequire(pkgParent);
const sfc = require('vue/compiler-sfc');

function isBare(spec) {
  return !spec.startsWith('.') && !spec.startsWith('/') && !/^[a-z]+:/.test(spec);
}

export async function resolve(specifier, context, next) {
  if (isBare(specifier) && context.parentURL?.startsWith('file:')) {
    return next(specifier, { ...context, parentURL: pkgParent });
  }
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const url = new URL(specifier, context.parentURL);
    if (!existsSync(url)) {
      for (const ext of ['.ts', '.js']) {
        const candidate = new URL(url.href + ext);
        if (existsSync(candidate)) return { url: candidate.href, shortCircuit: true };
      }
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true };
  if (url.endsWith('.ts') && url.startsWith(pathToFileURL(vueRootPath).href)) {
    const source = await readFile(new URL(url), 'utf8');
    return { format: 'module', source: stripTypeScriptTypes(source, { mode: 'strip' }), shortCircuit: true };
  }
  if (!url.endsWith('.vue')) return next(url, context);
  const filename = fileURLToPath(url);
  const source = await readFile(filename, 'utf8');
  const { descriptor, errors } = sfc.parse(source, { filename });
  if (errors.length) throw errors[0];
  const id = createHash('sha256').update(filename).digest('hex').slice(0, 8);
  let code;
  if (descriptor.script || descriptor.scriptSetup) {
    const script = sfc.compileScript(descriptor, { id, inlineTemplate: true });
    code = script.content;
    const ts = (descriptor.scriptSetup ?? descriptor.script).lang === 'ts';
    if (ts) code = stripTypeScriptTypes(code, { mode: 'transform' });
  } else {
    const tpl = sfc.compileTemplate({ source: descriptor.template.content, filename, id });
    code = tpl.code.replace('export function render', 'function render') +
      '\nexport default { render };';
  }
  return { format: 'module', source: code, shortCircuit: true };
}

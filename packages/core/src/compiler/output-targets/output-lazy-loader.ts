import { generatePreamble, isOutputTargetDistLazyLoader, join, relative, relativeImport } from '../../utils';

import type * as d from '@stencil/core';
import { getClientPolyfill } from '../app-core/app-polyfills';

export const outputLazyLoader = async (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx) => {
  const outputTargets = config.outputTargets.filter(isOutputTargetDistLazyLoader);
  if (outputTargets.length === 0) {
    return;
  }

  await Promise.all(outputTargets.map((o) => generateLoader(config, compilerCtx, o)));
};

const generateLoader = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  outputTarget: d.OutputTargetDistLazyLoader,
) => {
  const loaderPath = outputTarget.dir;
  const es2017Dir = outputTarget.esmDir;
  const es5Dir = outputTarget.esmEs5Dir || es2017Dir;
  const cjsDir = outputTarget.cjsDir;

  if (!loaderPath || !es2017Dir || !cjsDir) {
    return;
  }

  const es5HtmlElement = await getClientPolyfill(config, compilerCtx, 'es5-html-element.js');
  const polyfillsEntryPoint = join(es2017Dir, 'polyfills/index.js');
  const polyfillsExport = `export * from '${relative(loaderPath, polyfillsEntryPoint)}';`;

  const es5EntryPoint = join(es5Dir, 'loader.js');
  const indexContent = filterAndJoin([
    generatePreamble(config),
    es5HtmlElement,
    config.buildEs5 ? polyfillsExport : null,
    `export * from '${relative(loaderPath, es5EntryPoint)}';`,
  ]);

  const es2017EntryPoint = join(es2017Dir, 'loader.js');
  const indexES2017Content = filterAndJoin([
    generatePreamble(config),
    config.buildEs5 ? polyfillsExport : null,
    `export * from '${relative(loaderPath, es2017EntryPoint)}';`,
  ]);

  const cjsEntryPoint = join(cjsDir, 'loader.cjs.js');
  const indexCjsContent = filterAndJoin([
    generatePreamble(config),
    `module.exports = require('${relative(loaderPath, cjsEntryPoint)}');`,
    config.buildEs5 ? `module.exports.applyPolyfills = function() { return Promise.resolve() };` : null,
  ]);

  const indexDtsPath = join(loaderPath, 'index.d.ts');

  await Promise.all([
    compilerCtx.fs.writeFile(join(loaderPath, 'index.d.ts'), generateIndexDts(indexDtsPath, outputTarget.componentDts)),
    compilerCtx.fs.writeFile(join(loaderPath, 'index.js'), indexContent),
    compilerCtx.fs.writeFile(join(loaderPath, 'index.cjs.js'), indexCjsContent),
    compilerCtx.fs.writeFile(join(loaderPath, 'cdn.js'), indexCjsContent),
    compilerCtx.fs.writeFile(join(loaderPath, 'index.es2017.js'), indexES2017Content),
  ]);
};

const generateIndexDts = (indexDtsPath: string, componentsDtsPath: string) => {
  return `export * from '${relativeImport(indexDtsPath, componentsDtsPath, '.d.ts')}';
export interface CustomElementsDefineOptions {
  exclude?: string[];
  syncQueue?: boolean;
  jmp?: (c: Function) => any;
  raf?: (c: FrameRequestCallback) => number;
  ael?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;
  rel?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;
}
export declare function defineCustomElements(win?: Window, opts?: CustomElementsDefineOptions): void;
/**
 * @deprecated
 */
export declare function applyPolyfills(): Promise<void>;

/**
 * Used to specify a nonce value that corresponds with an application's CSP.
 * When set, the nonce will be added to all dynamically created script and style tags at runtime.
 * Alternatively, the nonce value can be set on a meta tag in the DOM head
 * (<meta name="csp-nonce" content="{ nonce value here }" />) which
 * will result in the same behavior.
 */
export declare function setNonce(nonce: string): void;
`;
};

/**
 * Given an array of 'parts' which can be assembled into a string 1) filter
 * out any parts that are `null` and 2) join the remaining strings into a single
 * output string
 *
 * @param parts an array of parts to filter and join
 * @returns the joined string
 */
function filterAndJoin(parts: (string | null)[]): string {
  return parts
    .filter((part) => part !== null)
    .join('\n')
    .trim();
}

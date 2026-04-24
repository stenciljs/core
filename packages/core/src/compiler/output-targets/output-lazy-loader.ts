import type * as d from '@stencil/core';

import {
  generatePreamble,
  isOutputTargetDistLazyLoader,
  join,
  relative,
  relativeImport,
} from '../../utils';

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
  const esmDir = outputTarget.esmDir;
  const cjsDir = outputTarget.cjsDir;

  if (!loaderPath || !esmDir) {
    return;
  }

  const esmEntryPoint = join(esmDir, 'loader.js');
  const indexContent = filterAndJoin([
    generatePreamble(config),
    `export * from '${relative(loaderPath, esmEntryPoint)}';`,
  ]);

  const indexDtsPath = join(loaderPath, 'index.d.ts');

  const writes: Promise<unknown>[] = [
    compilerCtx.fs.writeFile(
      join(loaderPath, 'index.d.ts'),
      generateIndexDts(indexDtsPath, outputTarget.componentDts),
    ),
    compilerCtx.fs.writeFile(join(loaderPath, 'index.js'), indexContent),
  ];

  // Only generate CJS files when cjsDir is configured
  if (cjsDir) {
    const cjsEntryPoint = join(cjsDir, 'loader.cjs');
    const indexCjsContent = filterAndJoin([
      generatePreamble(config),
      `module.exports = require('${relative(loaderPath, cjsEntryPoint)}');`,
    ]);
    writes.push(
      compilerCtx.fs.writeFile(join(loaderPath, 'index.cjs'), indexCjsContent),
      compilerCtx.fs.writeFile(join(loaderPath, 'cdn.js'), indexCjsContent),
    );
  }

  await Promise.all(writes);
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

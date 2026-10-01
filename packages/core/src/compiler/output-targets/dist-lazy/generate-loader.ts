import type * as d from '@stencil/core';

import { join, relativeImport } from '../../../utils';

/**
 * Generate the loader directory with forwarding files.
 * Creates index.js, index.cjs (if CJS enabled), and index.d.ts
 * that point to their respective sources.
 * @param compilerCtx the compiler context
 * @param outputTargets the list of output targets to generate loaders for
 * @returns a promise that resolves when all loader files have been generated
 */
export const generateLoader = async (
  compilerCtx: d.CompilerCtx,
  outputTargets: d.OutputTargetDistLazy[],
): Promise<void> => {
  await Promise.all(
    outputTargets.map(async (o) => {
      if (!o.loaderDir || !o.esmDir || !o.typesDir) {
        return;
      }

      // ESM: loader/index.js -> ../esm/loader.js
      const loaderIndexJs = join(o.loaderDir, 'index.js');
      const esmLoaderPath = join(o.esmDir, 'loader.js');
      const relativeEsmLoader = relativeImport(loaderIndexJs, esmLoaderPath);
      await compilerCtx.fs.writeFile(loaderIndexJs, `export * from '${relativeEsmLoader}';\n`, {
        outputTargetType: o.type,
      });

      // CJS: loader/index.cjs -> ../cjs/loader.cjs
      if (o.cjsDir) {
        const loaderIndexCjs = join(o.loaderDir, 'index.cjs');
        const cjsLoaderPath = join(o.cjsDir, 'loader.cjs');
        const relativeCjsLoader = relativeImport(loaderIndexCjs, cjsLoaderPath);
        await compilerCtx.fs.writeFile(
          loaderIndexCjs,
          `module.exports = require('${relativeCjsLoader}');\n`,
          { outputTargetType: o.type },
        );
      }

      // Types: loader/index.d.ts -> ../../types/loader.d.ts
      const loaderIndexDts = join(o.loaderDir, 'index.d.ts');
      const loaderDtsPath = join(o.typesDir, 'loader.d.ts');
      const relativeDtsPath = relativeImport(loaderIndexDts, loaderDtsPath);
      await compilerCtx.fs.writeFile(loaderIndexDts, `export * from '${relativeDtsPath}';\n`, {
        outputTargetType: o.type,
      });
    }),
  );
};

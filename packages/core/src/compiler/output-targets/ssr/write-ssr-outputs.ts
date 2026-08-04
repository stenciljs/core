import type * as d from '@stencil/core';
import type { RolldownOutput } from 'rolldown';

import { hasError, join } from '../../../utils';
import { optimizeModule } from '../../optimize/optimize-module';
import { relocateSsrContextConst } from './relocate-ssr-context';
import { MODE_RESOLUTION_CHAIN_DECLARATION } from './ssr-factory-closure';

/**
 * Applies post-processing transforms shared by both the `ssr` and `ssr-wasm` output targets.
 * Must be called on each chunk's code before writing to disk or passing to extism / javy.
 *
 * @param config The validated Stencil configuration.
 * @param compilerCtx The compiler context.
 * @param code The generated code for a single chunk output by Rolldown.
 * @returns The post-processed code.
 */
export const postProcessSsrCode = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  code: string,
): string => {
  code = relocateSsrContextConst(config, compilerCtx, code);

  code = code.replace(
    `//! let ${MODE_RESOLUTION_CHAIN_DECLARATION}`,
    `let ${MODE_RESOLUTION_CHAIN_DECLARATION}`,
  );

  const tagTransformFunctionPattern = /function (setTagTransformer|transformTag)\(/;
  if (tagTransformFunctionPattern.test(code)) {
    const injectCode = `\nvar $stencilTagTransform = { setTagTransformer: setTagTransformer, transformTag: transformTag };\n`;
    const lastTransformTagIndex = code.lastIndexOf('function transformTag(');
    const lastSetTagTransformerIndex = code.lastIndexOf('function setTagTransformer(');
    const injectionPoint = Math.max(lastTransformTagIndex, lastSetTagTransformerIndex);

    if (injectionPoint !== -1) {
      let braceCount = 0;
      let foundStart = false;
      let injectionIndex = injectionPoint;
      for (let i = injectionPoint; i < code.length; i++) {
        if (code[i] === '{') {
          foundStart = true;
          braceCount++;
        } else if (code[i] === '}') {
          braceCount--;
          if (foundStart && braceCount === 0) {
            injectionIndex = i + 1;
            break;
          }
        }
      }
      code = code.slice(0, injectionIndex) + injectCode + code.slice(injectionIndex);
    }
  }

  return code;
};

/**
 * Writes the generated SSR app code to disk for each SSR output target.
 * @param config The validated Stencil configuration.
 * @param compilerCtx The compiler context.
 * @param buildCtx The build context.
 * @param outputTargets The array of SSR output targets.
 * @param rolldownOutput The Rolldown output containing the generated code.
 * @returns A promise that resolves when all SSR outputs have been written.
 */
export const writeSsrOutputs = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetSsr[],
  rolldownOutput: RolldownOutput,
) => {
  return Promise.all(
    outputTargets.map((outputTarget) => {
      return writeSsrOutput(config, compilerCtx, buildCtx, outputTarget, rolldownOutput);
    }),
  );
};

const writeSsrOutput = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetSsr,
  rolldownOutput: RolldownOutput,
) => {
  const hydrateAppDirPath = outputTarget.dir;
  if (!hydrateAppDirPath) {
    throw new Error(`outputTarget config missing the "dir" property`);
  }

  await copySsrRunnerDts(config, compilerCtx, hydrateAppDirPath);

  // always remember a path to the hydrate app that the prerendering may need later on
  buildCtx.ssrAppFilePath = join(hydrateAppDirPath, 'index.js');
  const minify = outputTarget.minify === true;

  await Promise.all(
    rolldownOutput.output.map(async (output) => {
      if (output.type === 'chunk') {
        let code = postProcessSsrCode(config, compilerCtx, output.code);

        if (minify) {
          const optimizeResults = await optimizeModule(config, compilerCtx, {
            input: code,
            isCore: output.isEntry,
            minify,
          });

          buildCtx.diagnostics.push(...optimizeResults.diagnostics);
          if (
            !hasError(optimizeResults.diagnostics) &&
            typeof optimizeResults.output === 'string'
          ) {
            code = optimizeResults.output;
          }
        }

        const filePath = join(hydrateAppDirPath, output.fileName);
        await compilerCtx.fs.writeFile(filePath, code, { immediateWrite: true });
      }
    }),
  );
};

const copySsrRunnerDts = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  hydrateAppDirPath: string,
) => {
  const packageDir = join(config.sys.getCompilerExecutingPath(), '..', '..');
  const srcSsrDir = join(packageDir, 'runtime', 'server', 'runner.d.mts');

  const runnerDtsDestPath = join(hydrateAppDirPath, 'index.d.ts');

  await compilerCtx.fs.copyFile(srcSsrDir, runnerDtsDestPath);
};

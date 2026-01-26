import { hasError, join } from '@utils';
import type { RollupOutput } from 'rollup';

import type * as d from '../../../declarations';
import { optimizeModule } from '../../optimize/optimize-module';
import { MODE_RESOLUTION_CHAIN_DECLARATION } from './hydrate-factory-closure';
import { relocateHydrateContextConst } from './relocate-hydrate-context';

export const writeHydrateOutputs = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetHydrate[],
  rollupOutput: RollupOutput,
) => {
  return Promise.all(
    outputTargets.map((outputTarget) => {
      return writeHydrateOutput(config, compilerCtx, buildCtx, outputTarget, rollupOutput);
    }),
  );
};

const writeHydrateOutput = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetHydrate,
  rollupOutput: RollupOutput,
) => {
  const hydrateAppDirPath = outputTarget.dir;
  if (!hydrateAppDirPath) {
    throw new Error(`outputTarget config missing the "dir" property`);
  }

  const hydrateCoreIndexPath = join(hydrateAppDirPath, 'index.js');
  await Promise.all([
    copyHydrateRunnerDts(config, compilerCtx, hydrateAppDirPath),
    writeHydratePackageJson(compilerCtx, hydrateAppDirPath),
  ]);

  // always remember a path to the hydrate app that the prerendering may need later on
  buildCtx.hydrateAppFilePath = hydrateCoreIndexPath;
  const minify = outputTarget.minify === true;

  await Promise.all(
    rollupOutput.output.map(async (output) => {
      if (output.type === 'chunk') {
        let code = relocateHydrateContextConst(config, compilerCtx, output.code);

        /**
         * Enable the line where we define `modeResolutionChain` for the hydrate module.
         */
        code = code.replace(
          `// const ${MODE_RESOLUTION_CHAIN_DECLARATION}`,
          `const ${MODE_RESOLUTION_CHAIN_DECLARATION}`,
        );

        /**
         * Inject the $stencilTagTransform variable definition.
         * This variable is referenced by the factory closure (HYDRATE_FACTORY_INTRO)
         * and must be defined at module scope to be accessible within the factory.
         * We inject it after the tag transform functions are defined/exported.
         */
        const tagTransformFunctionPattern = /function (setTagTransformer|transformTag)\(/;
        const match = code.match(tagTransformFunctionPattern);
        if (match) {
          // Find where setTagTransformer and transformTag functions are defined
          // and inject the $stencilTagTransform variable after them
          const injectCode = `\n// Tag transform state object for factory closure\nvar $stencilTagTransform = { setTagTransformer: setTagTransformer, transformTag: transformTag };\n`;

          // Find the last occurrence of tag transform function definitions
          const lastTransformTagIndex = code.lastIndexOf('function transformTag(');
          const lastSetTagTransformerIndex = code.lastIndexOf('function setTagTransformer(');
          const injectionPoint = Math.max(lastTransformTagIndex, lastSetTagTransformerIndex);

          if (injectionPoint !== -1) {
            // Find the end of that function (closing brace)
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

        if (minify) {
          const optimizeResults = await optimizeModule(config, compilerCtx, {
            input: code,
            isCore: output.isEntry,
            minify,
          });

          buildCtx.diagnostics.push(...optimizeResults.diagnostics);
          if (!hasError(optimizeResults.diagnostics) && typeof optimizeResults.output === 'string') {
            code = optimizeResults.output;
          }
        }

        const filePath = join(hydrateAppDirPath, output.fileName);
        await compilerCtx.fs.writeFile(filePath, code, { immediateWrite: true });
      }
    }),
  );
};

const copyHydrateRunnerDts = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  hydrateAppDirPath: string,
) => {
  const packageDir = join(config.sys.getCompilerExecutingPath(), '..', '..');
  const srcHydrateDir = join(packageDir, 'internal', 'hydrate', 'runner.d.ts');

  const runnerDtsDestPath = join(hydrateAppDirPath, 'index.d.ts');

  await compilerCtx.fs.copyFile(srcHydrateDir, runnerDtsDestPath);
};

/**
 * Write a minimal package.json to the hydrate output directory to ensure
 * Node.js treats the .js files as CommonJS, even when the consumer package
 * has "type": "module" in its package.json.
 */
const writeHydratePackageJson = async (compilerCtx: d.CompilerCtx, hydrateAppDirPath: string) => {
  const packageJsonPath = join(hydrateAppDirPath, 'package.json');
  await compilerCtx.fs.writeFile(packageJsonPath, JSON.stringify({ type: 'commonjs' }), { immediateWrite: true });
};

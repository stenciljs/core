import MagicString from 'magic-string';
import { InputOptions } from 'rolldown';
import { rolldown, type RolldownBuild } from 'rolldown';
import type * as d from '@stencil/core';

import {
  catchError,
  createOnWarnFn,
  generatePreamble,
  isRolldownError,
  join,
  loadRolldownDiagnostics,
} from '../../../utils';
import {
  STENCIL_APP_DATA_ID,
  STENCIL_SSR_FACTORY_ID,
  STENCIL_INTERNAL_SSR_PLATFORM_ID,
} from '../../bundle/entry-alias-ids';
import { bundleSsrFactory } from './bundle-ssr-factory';
import {
  SSR_FACTORY_INTRO,
  SSR_FACTORY_OUTRO,
  MODE_RESOLUTION_CHAIN_DECLARATION,
} from './ssr-factory-closure';
import { updateSsrComponents } from './update-to-ssr-components';
import { writeSsrOutputs } from './write-ssr-outputs';

/**
 * Generates the SSR app factory and writes it to disk for each SSR output target.
 * @param format The module format to generate (esm or cjs).
 * @param rolldownBuild The Rolldown build instance.
 * @param config The validated Stencil configuration.
 * @param compilerCtx The compiler context.
 * @param buildCtx The build context.
 * @param outputTargets The array of SSR output targets.
 */
const buildSsrAppFor = async (
  format: 'esm' | 'cjs',
  rolldownBuild: RolldownBuild,
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetSsr[],
) => {
  const file = format === 'esm' ? 'index.js' : 'index.cjs';
  const rolldownOutput = await rolldownBuild.generate({
    banner: generatePreamble(config),
    format,
    file,
  });

  await writeSsrOutputs(config, compilerCtx, buildCtx, outputTargets, rolldownOutput);
};

/**
 * Generate and build the SSR app and then write it to disk
 *
 * @param config a validated Stencil configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTargets the output targets for the current build
 */
export const generateSsrApp = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetSsr[],
) => {
  try {
    const packageDir = join(config.sys.getCompilerExecutingPath(), '..', '..');
    const input = join(packageDir, 'runtime', 'server', 'runner.mjs');
    const appData = join(packageDir, 'runtime', 'app-data', 'index.js');

    const rolldownOptions: InputOptions = {
      ...config.rolldownConfig,
      external: ['node:stream'],
      input,
      plugins: [
        {
          name: 'ssrAppPlugin',
          // Use Rolldown's hook filter to only process specific Stencil IDs
          resolveId: {
            filter: { id: /^@stencil\/core\/runtime\/(server\/ssr-factory|app-data)$/ },
            handler(id) {
              if (id === STENCIL_SSR_FACTORY_ID) {
                return STENCIL_SSR_FACTORY_ID;
              }
              if (id === STENCIL_APP_DATA_ID) {
                return appData;
              }
              return null;
            },
          },
          load: {
            filter: { id: /^@stencil\/core\/runtime\/server\/ssr-factory$/ },
            handler(id) {
              if (id === STENCIL_SSR_FACTORY_ID) {
                return generateSsrFactory(config, compilerCtx, buildCtx);
              }
              return null;
            },
          },
          transform(code, _id) {
            /**
             * Remove the modeResolutionChain variable from the generated code.
             * This variable is redefined in `SSR_FACTORY_INTRO` to ensure we can
             * use it within the ssr and global runtime.
             */
            const searchPattern = `const ${MODE_RESOLUTION_CHAIN_DECLARATION}`;
            // Only process if the code contains the pattern (avoid unnecessary work)
            if (!code.includes(searchPattern)) {
              return null;
            }
            return code.replaceAll(searchPattern, '');
          },
        },
      ],
      treeshake: false,
      onwarn: createOnWarnFn(buildCtx.diagnostics),
      checks: {
        pluginTimings: config.logLevel === 'debug',
      },
    };

    const rolldownAppBuild = await rolldown(rolldownOptions);
    const buildPromises = [
      buildSsrAppFor('esm', rolldownAppBuild, config, compilerCtx, buildCtx, outputTargets),
    ];
    if (outputTargets.some((o) => o.cjs)) {
      buildPromises.push(
        buildSsrAppFor('cjs', rolldownAppBuild, config, compilerCtx, buildCtx, outputTargets),
      );
    }
    await Promise.all(buildPromises);
  } catch (e) {
    if (!buildCtx.hasError && isRolldownError(e)) {
      loadRolldownDiagnostics(config, compilerCtx, buildCtx, e);
    }
  }
};

export const generateSsrFactory = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  if (!buildCtx.hasError) {
    try {
      const appFactoryEntryCode = await generateSsrFactoryEntry(buildCtx);

      const rolldownFactoryBuild = await bundleSsrFactory(
        config,
        compilerCtx,
        buildCtx,
        appFactoryEntryCode,
      );
      if (rolldownFactoryBuild != null) {
        const rolldownOutput = await rolldownFactoryBuild.generate({
          format: 'cjs',
          esModule: false,
          strict: false,
          intro: SSR_FACTORY_INTRO,
          outro: SSR_FACTORY_OUTRO,
          codeSplitting: false,
        });

        if (!buildCtx.hasError && rolldownOutput != null && Array.isArray(rolldownOutput.output)) {
          return rolldownOutput.output[0].code;
        }
      }
    } catch (e: any) {
      catchError(buildCtx.diagnostics, e);
    }
  }
  return '';
};

const generateSsrFactoryEntry = async (buildCtx: d.BuildCtx) => {
  const cmps = buildCtx.components;
  const ssrCmps = await updateSsrComponents(cmps);
  const s = new MagicString('');

  s.append(
    `import { ssrApp, registerComponents, styles } from '${STENCIL_INTERNAL_SSR_PLATFORM_ID}';\n`,
  );

  ssrCmps.forEach((cmpData) => s.append(cmpData.importLine + '\n'));

  s.append(`registerComponents([\n`);
  ssrCmps.forEach((cmpData) => {
    s.append(`  ${cmpData.uniqueComponentClassName},\n`);
  });
  s.append(`]);\n`);
  s.append(`export { ssrApp }\n`);

  return s.toString();
};

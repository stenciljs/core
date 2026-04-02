import MagicString from 'magic-string';
import { InputOptions } from 'rolldown';
import { rolldown, type RolldownBuild } from 'rolldown';
import type * as d from '@stencil/core';

import {
  catchError,
  createOnWarnFn,
  generatePreamble,
  join,
  loadRolldownDiagnostics,
} from '../../../utils';
import {
  STENCIL_APP_DATA_ID,
  STENCIL_HYDRATE_FACTORY_ID,
  STENCIL_INTERNAL_HYDRATE_PLATFORM_ID,
} from '../../bundle/entry-alias-ids';
import { bundleHydrateFactory } from './bundle-hydrate-factory';
import {
  HYDRATE_FACTORY_INTRO,
  HYDRATE_FACTORY_OUTRO,
  MODE_RESOLUTION_CHAIN_DECLARATION,
} from './hydrate-factory-closure';
import { updateToHydrateComponents } from './update-to-hydrate-components';
import { writeHydrateOutputs } from './write-hydrate-outputs';

const buildHydrateAppFor = async (
  format: 'esm' | 'cjs',
  rolldownBuild: RolldownBuild,
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetHydrate[],
) => {
  const file = format === 'esm' ? 'index.mjs' : 'index.js';
  const rolldownOutput = await rolldownBuild.generate({
    banner: generatePreamble(config),
    format,
    file,
  });

  await writeHydrateOutputs(config, compilerCtx, buildCtx, outputTargets, rolldownOutput);
};

/**
 * Generate and build the hydrate app and then write it to disk
 *
 * @param config a validated Stencil configuration
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTargets the output targets for the current build
 */
export const generateHydrateApp = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetHydrate[],
) => {
  try {
    const packageDir = join(config.sys.getCompilerExecutingPath(), '..', '..');
    const input = join(packageDir, 'runtime', 'server', 'runner.mjs');
    const appData = join(packageDir, 'runtime', 'app-data', 'index.js');

    const rolldownOptions: InputOptions = {
      ...config.rolldownConfig.inputOptions,
      external: ['node:stream'],
      input,
      plugins: [
        {
          name: 'hydrateAppPlugin',
          // Use Rolldown's hook filter to only process specific Stencil IDs
          resolveId: {
            filter: { id: /^@stencil\/core\/runtime\/(server\/hydrate-factory|app-data)$/ },
            handler(id) {
              if (id === STENCIL_HYDRATE_FACTORY_ID) {
                return STENCIL_HYDRATE_FACTORY_ID;
              }
              if (id === STENCIL_APP_DATA_ID) {
                return appData;
              }
              return null;
            },
          },
          load: {
            filter: { id: /^@stencil\/core\/runtime\/server\/hydrate-factory$/ },
            handler(id) {
              if (id === STENCIL_HYDRATE_FACTORY_ID) {
                return generateHydrateFactory(config, compilerCtx, buildCtx);
              }
              return null;
            },
          },
          transform(code, _id) {
            /**
             * Remove the modeResolutionChain variable from the generated code.
             * This variable is redefined in `HYDRATE_FACTORY_INTRO` to ensure we can
             * use it within the hydrate and global runtime.
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
        pluginTimings: config.devMode,
      },
    };

    const rolldownAppBuild = await rolldown(rolldownOptions);
    await Promise.all([
      buildHydrateAppFor('cjs', rolldownAppBuild, config, compilerCtx, buildCtx, outputTargets),
      buildHydrateAppFor('esm', rolldownAppBuild, config, compilerCtx, buildCtx, outputTargets),
    ]);
  } catch (e: any) {
    if (!buildCtx.hasError) {
      // TODO(STENCIL-353): Implement a type guard that balances using our own copy of Rolldown types (which are
      // breakable) and type safety (so that the error variable may be something other than `any`)
      loadRolldownDiagnostics(config, compilerCtx, buildCtx, e);
    }
  }
};

const generateHydrateFactory = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  if (!buildCtx.hasError) {
    try {
      const appFactoryEntryCode = await generateHydrateFactoryEntry(buildCtx);

      const rolldownFactoryBuild = await bundleHydrateFactory(
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
          intro: HYDRATE_FACTORY_INTRO,
          outro: HYDRATE_FACTORY_OUTRO,
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

const generateHydrateFactoryEntry = async (buildCtx: d.BuildCtx) => {
  const cmps = buildCtx.components;
  const hydrateCmps = await updateToHydrateComponents(cmps);
  const s = new MagicString('');

  s.append(
    `import { hydrateApp, registerComponents, styles } from '${STENCIL_INTERNAL_HYDRATE_PLATFORM_ID}';\n`,
  );

  hydrateCmps.forEach((cmpData) => s.append(cmpData.importLine + '\n'));

  s.append(`registerComponents([\n`);
  hydrateCmps.forEach((cmpData) => {
    s.append(`  ${cmpData.uniqueComponentClassName},\n`);
  });
  s.append(`]);\n`);
  s.append(`export { hydrateApp }\n`);

  return s.toString();
};

import type { BuildOptions as ESBuildOptions, BuildResult as ESBuildResult, OutputFile, Plugin } from 'esbuild';
import { build, context } from 'esbuild';

import { BuildOptions } from '../../utils/options';

/**
 * Aliases which map the module identifiers we set in `paths` in `tsconfig.json` to
 * bundles (built either with esbuild or with rollup).
 *
 * @returns a map of aliases to bundle entry points, relative to the root directory
 */
export function getEsbuildAliases(): Record<string, string> {
  return {
    // node module redirection
    chalk: 'ansi-colors',

    // mapping aliases to top-level bundle entrypoints
    '@stencil/core/testing': '../testing/index.js',
    '@stencil/core/compiler': '../compiler/stencil.js',
    '@stencil/core/dev-server': '../dev-server/index.js',
    '@stencil/core/mock-doc': '../mock-doc/index.cjs',
    '@stencil/core/internal/testing': '../internal/testing/index.js',
    '@stencil/core/cli': '../cli/index.cjs',
    '@sys-api-node': '../sys/node/index.js',
  };
}

/**
 * Node modules which should be universally marked as external
 *
 * Note that we should not rely on this to mark node.js built-in modules as
 * external. Doing so will override esbuild's automatic marking of those modules
 * as side-effect-free, which allows imports from them to be properly
 * tree-shaken.
 */
export const externalNodeModules = [
  '@jest/core',
  '@jest/reporters',
  '@microsoft/typescript-etw',
  'expect',
  'fsevents',
  'jest',
  'jest-cli',
  'jest-config',
  'jest-message-id',
  'jest-pnp-resolver',
  'jest-environment-node',
  'jest-runner',
  'puppeteer',
  'puppeteer-core',
  'yargs',
];

/**
 * A helper which runs an array of esbuild, uh, _builds_
 *
 * This accepts an array of build configurations and will either run a
 * synchronous build _or_ run them all in watch mode, depending on the
 * {@link BuildOptions['isWatch']} setting.
 *
 * @param builds the array of outputs to build
 * @param opts Stencil build options
 * @returns a Promise representing the execution of the builds
 */
export function runBuilds(builds: ESBuildOptions[], opts: BuildOptions): Promise<(void | ESBuildResult)[]> {
  if (opts.isWatch) {
    return Promise.all(
      builds.map(async (buildConfig) => {
        const ctx = await context(buildConfig);
        return ctx.watch();
      }),
    );
  } else {
    return Promise.all(builds.map(build));
  }
}

/**
 * Get base esbuild options which we want to always have set for all of our
 * bundles
 *
 * @returns a base set of options
 */
export function getBaseEsbuildOptions(): ESBuildOptions {
  const options: ESBuildOptions = {
    bundle: true,
    legalComments: 'inline',
    logLevel: 'info',
    target: getEsbuildTargets(),
  };

  // if the `build` sub-command is called with the `DEBUG` env var, like
  //
  // DEBUG=true npm run build
  //
  // then we should produce sourcemaps.
  if (process.env.DEBUG) {
    options.sourcemap = 'linked';
  }

  return options;
}

/**
 * Get build targets with minimal supported browser versions
 * @see https://stenciljs.com/docs/support-policy#browser-support
 * @returns an array of build targets
 */
export function getEsbuildTargets(): string[] {
  return ['node16', 'chrome79', 'edge79', 'firefox70', 'safari14'];
}

/**
 * Alias and mark a module as external at the same time
 *
 * @param moduleId the module ID to alias and externalize
 * @param resolveToPath the path to which imports of the module should be rewritten
 * @returns an Esbuild plugin
 */
export function externalAlias(moduleId: string, resolveToPath: string): Plugin {
  return {
    name: 'externalAliases',
    setup(build) {
      build.onResolve({ filter: new RegExp(`^${moduleId}$`) }, () => {
        return {
          path: resolveToPath,
          external: true,
        };
      });
    },
  };
}

/**
 * Extract the first {@link OutputFile} record from an Esbuild
 * {@link BuildResult}. This _may_ not be present, so in order to guarantee
 * type safety this function throws if such an `OutputFile` cannot be found.
 *
 * @throws if no `OutputFile` can be found.
 * @param buildResult the Esbuild build result in which to look
 * @returns the OutputFile
 */
export function getFirstOutputFile(buildResult: ESBuildResult): OutputFile {
  const bundle = buildResult.outputFiles?.[0];
  if (!bundle) {
    throw new Error('Could not find an output file in the BuildResult!');
  }
  return bundle;
}

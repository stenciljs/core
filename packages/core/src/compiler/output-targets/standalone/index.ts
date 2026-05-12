import ts from 'typescript';
import type * as d from '@stencil/core';

import {
  catchError,
  dashToPascalCase,
  filterActiveTargets,
  generatePreamble,
  getSourceMappingUrlForEndOfFile,
  hasError,
  isBoolean,
  isOutputTargetAssets,
  isOutputTargetStandalone,
  isString,
  join,
  relative,
  rolldownToStencilSourceMap,
} from '../../../utils';
import { bundleOutput } from '../../bundle/bundle-output';
import {
  STENCIL_APP_GLOBALS_ID,
  STENCIL_INTERNAL_CLIENT_PLATFORM_ID,
  USER_INDEX_ENTRY_ID,
} from '../../bundle/entry-alias-ids';
import { optimizeModule } from '../../optimize/optimize-module';
import { addTagTransform } from '../../transformers/add-tag-transform';
import { addDefineCustomElementFunctions } from '../../transformers/component-native/add-define-custom-element-function';
import { proxyCustomElement } from '../../transformers/component-native/proxy-custom-element-function';
import { nativeComponentTransform } from '../../transformers/component-native/tranform-to-native-component';
import { removeRebundleImports } from '../../transformers/remove-rebundle-imports';
import { rewriteAliasedSourceFileImportPaths } from '../../transformers/rewrite-aliased-paths';
import { updateStencilCoreImports } from '../../transformers/update-stencil-core-import';
import { generateLoaderModule } from './generate-loader-module';
import { getStandaloneBuildConditionals } from './standalone-build-conditionals';
import type { BundleOptions } from '../../bundle/bundle-interface';

/**
 * Main output target function for `standalone` (standalone component modules). This function just
 * does some organizational work to call the other functions in this module,
 * which do actual work of generating the rolldown configuration, creating an
 * entry chunk, running, the build, etc.
 *
 * @param config the validated compiler configuration we're using
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @returns an empty Promise which won't resolve until the work is done!
 */
export const outputStandalone = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  const outputTargets = filterActiveTargets(
    config.outputTargets.filter(isOutputTargetStandalone),
    config.devMode,
  );
  if (outputTargets.length === 0) {
    return;
  }

  const bundlingEventMessage = `generate custom elements${config.sourceMap ? ' + source maps' : ''}`;
  const timespan = buildCtx.createTimeSpan(`${bundlingEventMessage} started`);

  await Promise.all(
    outputTargets.map((target) => bundleStandalone(config, compilerCtx, buildCtx, target)),
  );

  timespan.finish(`${bundlingEventMessage} finished`);
};

/**
 * Get bundle options for our current build and compiler context which we'll use
 * to generate a Rolldown build and so on.
 *
 * @param config a validated Stencil configuration object
 * @param buildCtx the current build context
 * @param compilerCtx the current compiler context
 * @param outputTarget the outputTarget we're currently dealing with
 * @returns bundle options suitable for generating a rolldown configuration
 */
export const getBundleOptions = (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  compilerCtx: d.CompilerCtx,
  outputTarget: d.OutputTargetStandalone,
): BundleOptions => ({
  id: 'customElements',
  platform: 'client',
  conditionals: getStandaloneBuildConditionals(config, buildCtx.components),
  customBeforeTransformers: getCustomBeforeTransformers(
    config,
    compilerCtx,
    buildCtx.components,
    outputTarget,
    buildCtx,
  ),
  externalRuntime: !!outputTarget.externalRuntime,
  inlineWorkers: true,
  inputs: {
    // Here we prefix our index chunk with '\0' to tell Rolldown that we're
    // going to be using virtual modules with this module. A leading '\0'
    // prevents other plugins from messing with the module. We generate a
    // string for the index chunk below in the `loader` property.
    //
    // @see {@link https://rolldownjs.org/guide/en/#conventions} for more info.
    index: '\0core',
  },
  loader: {},
  preserveEntrySignatures: 'allow-extension',
});

/**
 * Get bundle options for rolldown, run the rolldown build, optionally minify the
 * output, and write files to disk.
 *
 * @param config the validated Stencil configuration we're using
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param outputTarget the outputTarget we're currently dealing with
 * @returns an empty promise
 */
export const bundleStandalone = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetStandalone,
) => {
  try {
    const bundleOpts = getBundleOptions(config, buildCtx, compilerCtx, outputTarget);

    addStandaloneInputs(config, buildCtx, bundleOpts, outputTarget);

    const build = await bundleOutput(config, compilerCtx, buildCtx, bundleOpts);

    if (build) {
      const rolldownOutput = await build.generate({
        banner: generatePreamble(config),
        format: 'esm',
        sourcemap: config.sourceMap,
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js',
        hoistTransitiveImports: false,
      });

      // the output target should have been validated at this point - as a result, we expect this field
      // to have been backfilled if it wasn't provided
      const outputTargetDir: string = outputTarget.dir!;

      // besides, if it isn't here we do a diagnostic and an early return
      if (!isString(outputTargetDir)) {
        buildCtx.diagnostics.push({
          level: 'error',
          type: 'build',
          messageText: 'standalone output target provided with no output target directory!',
          lines: [],
        });
        return;
      }

      const minify = isBoolean(outputTarget.minify) ? outputTarget.minify : config.minifyJs;
      const files = rolldownOutput.output.map(async (bundle) => {
        if (bundle.type === 'chunk') {
          let code = bundle.code;
          let sourceMap = bundle.map ? rolldownToStencilSourceMap(bundle.map) : undefined;

          const optimizeResults = await optimizeModule(config, compilerCtx, {
            input: code,
            isCore: bundle.isEntry,
            minify,
            sourceMap,
          });
          buildCtx.diagnostics.push(...optimizeResults.diagnostics);
          if (
            !hasError(optimizeResults.diagnostics) &&
            typeof optimizeResults.output === 'string'
          ) {
            code = optimizeResults.output;
          }
          if (optimizeResults.sourceMap) {
            sourceMap = optimizeResults.sourceMap;
            code = code + getSourceMappingUrlForEndOfFile(bundle.fileName);
            await compilerCtx.fs.writeFile(
              join(outputTargetDir, bundle.fileName + '.map'),
              JSON.stringify(sourceMap),
              {
                outputTargetType: outputTarget.type,
              },
            );
          }
          await compilerCtx.fs.writeFile(join(outputTargetDir, bundle.fileName), code, {
            outputTargetType: outputTarget.type,
          });
        }
      });
      await Promise.all(files);
    }
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }
};

/**
 * Create the virtual modules/input modules for the `standalone` output target.
 * @param config the validated compiler configuration
 * @param buildCtx the context for the current build
 * @param bundleOpts the bundle options to store the virtual modules under. acts as an output parameter
 * @param outputTarget the configuration for the standalone output target
 */
export const addStandaloneInputs = (
  config: d.ValidatedConfig,
  buildCtx: d.BuildCtx,
  bundleOpts: BundleOptions,
  outputTarget: d.OutputTargetStandalone,
): void => {
  const components = buildCtx.components;
  // An array to store the imports of these modules that we're going to add to our entry chunk
  const indexImports: string[] = [];
  // An array to store the export declarations that we're going to add to our entry chunk
  const indexExports: string[] = [];
  // An array to store the exported component names that will be used for the `defineCustomElements`
  // function on the `bundle` export behavior option
  const exportNames: string[] = [];

  components.forEach((cmp) => {
    const exp: string[] = [];
    const exportName = dashToPascalCase(cmp.tagName);
    const importName = cmp.componentClassName;
    const importAs = `$Cmp${exportName}`;
    const coreKey = `\0${exportName}`;

    if (cmp.isPlain) {
      exp.push(`export { ${importName} as ${exportName} } from '${cmp.sourceFilePath}';`);
      indexExports.push(`export { ${exportName} } from '${coreKey}';`);
    } else {
      // the `importName` may collide with the `exportName`, alias it just in case it does with `importAs`
      exp.push(
        `import { ${importName} as ${importAs}, defineCustomElement as cmpDefCustomEle } from '${cmp.sourceFilePath}';`,
      );
      exp.push(`export const ${exportName} = ${importAs};`);
      exp.push(`export const defineCustomElement = cmpDefCustomEle;`);

      // Here we push an export (with a rename for `defineCustomElement`) for
      // this component onto our array which references the `coreKey` (prefixed
      // with `\0`). We have to do this so that our import is referencing the
      // correct virtual module, if we instead referenced, for instance,
      // `cmp.sourceFilePath`, we would end up with duplicated modules in our
      // output.
      indexExports.push(
        `export { ${exportName}, defineCustomElement as defineCustomElement${exportName} } from '${coreKey}';`,
      );
    }

    indexImports.push(`import { ${exportName} } from '${coreKey}';`);
    exportNames.push(exportName);

    bundleOpts.inputs[cmp.tagName] = coreKey;
    bundleOpts.loader![coreKey] = exp.join('\n');
  });

  // Compute relative path from standalone dir to assets dir if components have assets
  let relativeAssetPath: string | undefined;
  const hasComponentsWithAssets = components.some(
    (cmp) => cmp.assetsDirs != null && cmp.assetsDirs.length > 0,
  );
  if (hasComponentsWithAssets) {
    const assetsTarget = config.outputTargets.find(isOutputTargetAssets);
    if (assetsTarget?.dir && outputTarget.dir) {
      // Compute relative path and ensure it ends with '/'
      const rel = relative(outputTarget.dir, assetsTarget.dir);
      relativeAssetPath = rel.endsWith('/') ? rel : rel + '/';
    }
  }

  // Generate the contents of the entry file to be created by the bundler
  bundleOpts.loader!['\0core'] = generateEntryPoint(
    outputTarget,
    indexImports,
    indexExports,
    exportNames,
    relativeAssetPath,
  );

  // Generate auto-loader module if enabled
  if (outputTarget.autoLoader) {
    const loaderFileName =
      typeof outputTarget.autoLoader === 'object'
        ? outputTarget.autoLoader.fileName || 'loader'
        : 'loader';

    bundleOpts.inputs[loaderFileName] = '\0loader';
    bundleOpts.loader!['\0loader'] = generateLoaderModule(
      components,
      outputTarget,
      relativeAssetPath,
    );
  }
};

/**
 * Generate the entrypoint (`index.ts` file) contents for the `standalone` output target
 * @param outputTarget the output target's configuration
 * @param cmpImports The import declarations for local component modules.
 * @param cmpExports The export declarations for local component modules.
 * @param cmpNames The exported component names (could be aliased) from local component modules.
 * @param relativeAssetPath Optional relative path from standalone dir to assets dir (e.g., '../assets/')
 * @returns the stringified contents to be placed in the entrypoint
 */
export const generateEntryPoint = (
  outputTarget: d.OutputTargetStandalone,
  cmpImports: string[] = [],
  cmpExports: string[] = [],
  cmpNames: string[] = [],
  relativeAssetPath?: string,
): string => {
  const body: string[] = [];
  const imports: string[] = [];
  const exports: string[] = [];

  // Exports that are always present
  exports.push(
    `export { setNonce, setPlatformOptions } from '${STENCIL_INTERNAL_CLIENT_PLATFORM_ID}';`,
    `export * from '${USER_INDEX_ENTRY_ID}';`,
  );

  // Auto-configure asset path if components use assets
  if (relativeAssetPath) {
    imports.push(`import { setAssetPath } from '${STENCIL_INTERNAL_CLIENT_PLATFORM_ID}';`);
    // Use import.meta.url for runtime resolution that works regardless of where bundle is hosted
    body.push(`setAssetPath(new URL('${relativeAssetPath}', import.meta.url).href);`);
  }

  // Content related to global scripts
  if (outputTarget.includeGlobalScripts !== false) {
    imports.push(`import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';`);
    body.push(`globalScripts();`);
  }

  // Content related to the `bundle` export behavior
  if (outputTarget.customElementsExportBehavior === 'bundle') {
    imports.push(`import { transformTag } from '${STENCIL_INTERNAL_CLIENT_PLATFORM_ID}';`);
    imports.push(...cmpImports);
    body.push(
      'export const defineCustomElements = (opts) => {',
      "    if (typeof customElements !== 'undefined') {",
      '        [',
      ...cmpNames.map((cmp) => `            ${cmp},`),
      '        ].forEach(cmp => {',
      '            if (!customElements.get(transformTag(cmp.is))) {',
      '                customElements.define(transformTag(cmp.is), cmp, opts);',
      '            }',
      '        });',
      '    }',
      '};',
    );
  }

  // Content related to the `single-export-module` export behavior
  if (outputTarget.customElementsExportBehavior === 'single-export-module') {
    exports.push(...cmpExports);
  }

  // Generate the contents of the file based on the parts
  // defined above. This keeps the file structure consistent as
  // new export behaviors may be added
  let content = '';

  // Add imports to file content
  content += imports.length ? imports.join('\n') + '\n' : '';
  // Add exports to file content
  content += exports.length ? exports.join('\n') + '\n' : '';
  // Add body to file content
  content += body.length ? '\n' + body.join('\n') + '\n' : '';

  return content;
};

/**
 * Get the series of custom transformers, specific to the needs of the
 * `standalone` output target, that will be applied to a Stencil
 * project's source code during the TypeScript transpilation process
 *
 * @param config the configuration for the Stencil project
 * @param compilerCtx the current compiler context
 * @param components the components that will be compiled as a part of the current build
 * @param outputTarget - the output target configuration
 * @param buildCtx - the current build context
 * @returns a list of transformers to use in the transpilation process
 */
const getCustomBeforeTransformers = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  components: d.ComponentCompilerMeta[],
  outputTarget: d.OutputTargetStandalone,
  buildCtx: d.BuildCtx,
): ts.TransformerFactory<ts.SourceFile>[] => {
  const transformOpts: d.TransformOptions = {
    coreImportPath: STENCIL_INTERNAL_CLIENT_PLATFORM_ID,
    componentExport: null,
    componentMetadata: null,
    currentDirectory: config.sys.getCurrentDirectory(),
    proxy: null,
    style: 'static',
    styleImportData: 'queryparams',
  };
  const customBeforeTransformers = [
    addDefineCustomElementFunctions(compilerCtx, components, outputTarget, config.devMode),
    updateStencilCoreImports(transformOpts.coreImportPath),
  ];

  if (config.transformAliasedImportPaths) {
    customBeforeTransformers.push(rewriteAliasedSourceFileImportPaths);
  }

  if (buildCtx.config.extras.additionalTagTransformers) {
    customBeforeTransformers.push(addTagTransform(compilerCtx, buildCtx));
  }

  customBeforeTransformers.push(
    nativeComponentTransform(compilerCtx, transformOpts, buildCtx),
    proxyCustomElement(compilerCtx, transformOpts),
    removeRebundleImports(compilerCtx),
  );
  return customBeforeTransformers;
};

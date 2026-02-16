import {
  formatComponentRuntimeMeta,
  getSourceMappingUrlForEndOfFile,
  hasDependency,
  join,
  rollupToStencilSourceMap,
  stringifyRuntimeData,
} from '@utils';
import type { SourceMap as RollupSourceMap } from 'rollup';

import type * as d from '../../../declarations';
import { optimizeModule } from '../../optimize/optimize-module';
import { writeLazyModule } from './write-lazy-entry-module';

export const generateLazyModules = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargetType: string,
  destinations: string[],
  results: d.RollupResult[],
  sourceTarget: d.SourceTarget,
  isBrowserBuild: boolean,
): Promise<d.BundleModule[]> => {
  if (!Array.isArray(destinations) || destinations.length === 0) {
    return [];
  }
  const shouldMinify = !!(config.minifyJs && isBrowserBuild);
  const rollupResults = results.filter((r): r is d.RollupChunkResult => r.type === 'chunk');
  const entryComponentsResults = rollupResults.filter((rollupResult) => rollupResult.isComponent);
  const chunkResults = rollupResults.filter((rollupResult) => !rollupResult.isComponent && !rollupResult.isEntry);

  const bundleModules = await Promise.all(
    entryComponentsResults.map((rollupResult) => {
      return generateLazyEntryModule(
        config,
        compilerCtx,
        buildCtx,
        rollupResult,
        outputTargetType,
        destinations,
        sourceTarget,
        shouldMinify,
        isBrowserBuild,
      );
    }),
  );

  if ((!!config.extras.experimentalImportInjection || !!config.extras.enableImportInjection) && !isBrowserBuild) {
    addStaticImports(rollupResults, bundleModules);
  }

  await Promise.all(
    chunkResults.map((rollupResult) => {
      return writeLazyChunk(
        config,
        compilerCtx,
        buildCtx,
        rollupResult,
        outputTargetType,
        destinations,
        sourceTarget,
        shouldMinify,
        isBrowserBuild,
      );
    }),
  );

  const lazyRuntimeData = formatLazyBundlesRuntimeMeta(bundleModules);
  const entryResults = rollupResults.filter((rollupResult) => !rollupResult.isComponent && rollupResult.isEntry);
  await Promise.all(
    entryResults.map((rollupResult) => {
      return writeLazyEntry(
        config,
        compilerCtx,
        buildCtx,
        rollupResult,
        outputTargetType,
        destinations,
        lazyRuntimeData,
        sourceTarget,
        shouldMinify,
        isBrowserBuild,
      );
    }),
  );

  await Promise.all(
    results
      .filter((r): r is d.RollupAssetResult => r.type === 'asset')
      .map((r: d.RollupAssetResult) => {
        return Promise.all(
          destinations.map((dest) => {
            return compilerCtx.fs.writeFile(join(dest, r.fileName), r.content);
          }),
        );
      }),
  );

  return bundleModules;
};

/**
 * Add imports for each bundle to Stencil's lazy loader. Some bundlers that are built atop of Rollup strictly impose
 * the limitations that are laid out in https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations.
 * This function injects an explicit import statement for each bundle that can be lazily loaded.
 * @param rollupChunkResults the results of running Rollup across a Stencil project
 * @param bundleModules lazy-loadable modules that can be resolved at runtime
 */
const addStaticImports = (rollupChunkResults: d.RollupChunkResult[], bundleModules: d.BundleModule[]): void => {
  rollupChunkResults.filter(isStencilCoreResult).forEach((index: d.RollupChunkResult) => {
    const generateCjs = isCjsFormat(index) ? generateCaseClauseCjs : generateCaseClause;
    index.code = index.code.replace(
      '/*!__STENCIL_STATIC_IMPORT_SWITCH__*/',
      `
        if (!hmrVersionId || !BUILD.hotModuleReplacement) {
          const processMod = importedModule => {
              cmpModules.set(bundleId, importedModule);
              return importedModule[exportName];
          }
          switch(bundleId) {
              ${bundleModules.map((mod) => generateCjs(mod.output.bundleId)).join('')}
          }
      }`,
    );
  });
};

/**
 * Determine if a Rollup output chunk contains Stencil runtime code
 * @param rollupChunkResult the rollup chunk output to test
 * @returns true if the output chunk contains Stencil runtime code, false otherwise
 */
const isStencilCoreResult = (rollupChunkResult: d.RollupChunkResult): boolean => {
  return (
    rollupChunkResult.isCore &&
    rollupChunkResult.entryKey === 'index' &&
    (rollupChunkResult.moduleFormat === 'es' ||
      rollupChunkResult.moduleFormat === 'esm' ||
      isCjsFormat(rollupChunkResult))
  );
};

/**
 * Helper function to determine if a Rollup chunk has a commonjs module format
 * @param rollupChunkResult the Rollup result to test
 * @returns true if the Rollup chunk has a commonjs module format, false otherwise
 */
const isCjsFormat = (rollupChunkResult: d.RollupChunkResult): boolean => {
  return rollupChunkResult.moduleFormat === 'cjs' || rollupChunkResult.moduleFormat === 'commonjs';
};

/**
 * Generate a 'case' clause to be used within a `switch` statement. The case clause generated will key-off the provided
 * bundle ID for a component, and load a file (tied to that ID) at runtime.
 * @param bundleId the name of the bundle to load
 * @returns the case clause that will load the component's file at runtime
 */
const generateCaseClause = (bundleId: string): string => {
  return `
                case '${bundleId}':
                    return import(
                      /* webpackMode: "lazy" */
                      './${bundleId}.entry.js').then(processMod, consoleError);`;
};

/**
 * Generate a 'case' clause to be used within a `switch` statement. The case clause generated will key-off the provided
 * bundle ID for a component, and load a CommonJS file (tied to that ID) at runtime.
 * @param bundleId the name of the bundle to load
 * @returns the case clause that will load the component's file at runtime
 */
const generateCaseClauseCjs = (bundleId: string): string => {
  return `
                case '${bundleId}':
                    return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require(
                        /* webpackMode: "lazy" */
                        './${bundleId}.entry.js')); }).then(processMod, consoleError);`;
};

const generateLazyEntryModule = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rollupResult: d.RollupChunkResult,
  outputTargetType: string,
  destinations: string[],
  sourceTarget: d.SourceTarget,
  shouldMinify: boolean,
  isBrowserBuild: boolean,
): Promise<d.BundleModule> => {
  const entryModule = buildCtx.entryModules.find((entryModule) => entryModule.entryKey === rollupResult.entryKey);

  const { code, sourceMap } = await convertChunk(
    config,
    compilerCtx,
    buildCtx,
    sourceTarget,
    shouldMinify,
    false,
    isBrowserBuild,
    rollupResult.code,
    rollupResult.map,
  );

  const output = await writeLazyModule(compilerCtx, outputTargetType, destinations, code, sourceMap, rollupResult);

  return {
    rollupResult,
    entryKey: rollupResult.entryKey,
    cmps: entryModule.cmps,
    output,
  };
};

const writeLazyChunk = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rollupResult: d.RollupChunkResult,
  outputTargetType: string,
  destinations: string[],
  sourceTarget: d.SourceTarget,
  shouldMinify: boolean,
  isBrowserBuild: boolean,
) => {
  const { code, sourceMap } = await convertChunk(
    config,
    compilerCtx,
    buildCtx,
    sourceTarget,
    shouldMinify,
    rollupResult.isCore,
    isBrowserBuild,
    rollupResult.code,
    rollupResult.map,
  );

  await Promise.all(
    destinations.map((dst) => {
      const filePath = join(dst, rollupResult.fileName);
      let fileCode = code;
      const writes: Promise<any>[] = [];
      if (sourceMap) {
        fileCode = code + getSourceMappingUrlForEndOfFile(rollupResult.fileName);
        writes.push(compilerCtx.fs.writeFile(filePath + '.map', JSON.stringify(sourceMap), { outputTargetType }));
      }
      writes.push(compilerCtx.fs.writeFile(filePath, fileCode, { outputTargetType }));
      return Promise.all(writes);
    }),
  );
};

const writeLazyEntry = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rollupResult: d.RollupChunkResult,
  outputTargetType: string,
  destinations: string[],
  lazyRuntimeData: string,
  sourceTarget: d.SourceTarget,
  shouldMinify: boolean,
  isBrowserBuild: boolean,
): Promise<void> => {
  if (isBrowserBuild && ['loader'].includes(rollupResult.entryKey)) {
    return;
  }
  const inputCode = rollupResult.code.replace(`[/*!__STENCIL_LAZY_DATA__*/]`, `${lazyRuntimeData}`);
  const { code, sourceMap } = await convertChunk(
    config,
    compilerCtx,
    buildCtx,
    sourceTarget,
    shouldMinify,
    false,
    isBrowserBuild,
    inputCode,
    rollupResult.map,
  );

  await Promise.all(
    destinations.map((dst) => {
      const filePath = join(dst, rollupResult.fileName);
      let fileCode = code;
      const writes: Promise<any>[] = [];
      if (sourceMap) {
        fileCode = code + getSourceMappingUrlForEndOfFile(rollupResult.fileName);
        writes.push(compilerCtx.fs.writeFile(filePath + '.map', JSON.stringify(sourceMap), { outputTargetType }));
      }
      writes.push(compilerCtx.fs.writeFile(filePath, fileCode, { outputTargetType }));
      return Promise.all(writes);
    }),
  );
};

/**
 * Sorts, formats, and stringifies the bundles for a lazy build of a Stencil project.
 *
 * @param bundleModules The modules for the Stencil lazy build emitted from Rollup.
 * @returns A stringified representation of the lazy bundles.
 */
const formatLazyBundlesRuntimeMeta = (bundleModules: d.BundleModule[]): string => {
  const sortedBundles = bundleModules.slice().sort(sortBundleModules);
  const lazyBundles = sortedBundles.map(formatLazyRuntimeBundle);
  return stringifyRuntimeData(lazyBundles);
};

/**
 * Formats a bundle module into a tuple of bundle ID and component metadata for use at runtime.
 *
 * @param bundleModule The bundle module to format.
 * @returns A tuple of bundle ID and component metadata.
 */
const formatLazyRuntimeBundle = (bundleModule: d.BundleModule): d.LazyBundleRuntimeData => {
  const bundleId = bundleModule.output.bundleId;
  const bundleCmps = bundleModule.cmps.slice().sort(sortBundleComponents);
  return [bundleId, bundleCmps.map((cmp) => formatComponentRuntimeMeta(cmp, true))];
};

/**
 * Sorts bundle modules by the number of dependents, dependencies, and containing component tags.
 * Dependencies/dependents may also include components that are statically slotted into other components.
 * The order of the bundle modules is important because it determines the order in which the bundles are loaded
 * and subsequently the order that their respective components are defined and connected (i.e. via the `connectedCallback`)
 * at runtime.
 *
 * This must be a valid {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#comparefn | compareFn}
 *
 * @param a The first argument to compare.
 * @param b The second argument to compare.
 * @returns A number indicating whether the first argument is less than/greater than/equal to the second argument.
 */
export const sortBundleModules = (a: d.BundleModule, b: d.BundleModule): -1 | 1 | 0 => {
  const aDependents = a.cmps.reduce((dependents, cmp) => {
    dependents.push(...cmp.dependents);
    return dependents;
  }, [] as string[]);
  const bDependents = b.cmps.reduce((dependents, cmp) => {
    dependents.push(...cmp.dependents);
    return dependents;
  }, [] as string[]);

  if (a.cmps.some((cmp) => bDependents.includes(cmp.tagName))) return 1;
  if (b.cmps.some((cmp) => aDependents.includes(cmp.tagName))) return -1;

  const aDependencies = a.cmps.reduce((dependencies, cmp) => {
    dependencies.push(...cmp.dependencies);
    return dependencies;
  }, [] as string[]);
  const bDependencies = b.cmps.reduce((dependencies, cmp) => {
    dependencies.push(...cmp.dependencies);
    return dependencies;
  }, [] as string[]);

  if (a.cmps.some((cmp) => bDependencies.includes(cmp.tagName))) return -1;
  if (b.cmps.some((cmp) => aDependencies.includes(cmp.tagName))) return 1;

  if (aDependents.length < bDependents.length) return -1;
  if (aDependents.length > bDependents.length) return 1;

  if (aDependencies.length > bDependencies.length) return -1;
  if (aDependencies.length < bDependencies.length) return 1;

  const aTags = a.cmps.map((cmp) => cmp.tagName);
  const bTags = b.cmps.map((cmp) => cmp.tagName);

  if (aTags.length > bTags.length) return -1;
  if (aTags.length < bTags.length) return 1;

  const aTagsStr = aTags.sort().join('.');
  const bTagsStr = bTags.sort().join('.');

  if (aTagsStr < bTagsStr) return -1;
  if (aTagsStr > bTagsStr) return 1;

  return 0;
};

export const sortBundleComponents = (a: d.ComponentCompilerMeta, b: d.ComponentCompilerMeta): -1 | 1 | 0 => {
  // <cmp-a>
  //   <cmp-b>
  //     <cmp-c></cmp-c>
  //   </cmp-b>
  // </cmp-a>

  // cmp-c is a dependency of cmp-a and cmp-b
  // cmp-c is a directDependency of cmp-b
  // cmp-a is a dependant of cmp-b and cmp-c
  // cmp-a is a directDependant of cmp-b

  if (a.directDependents.includes(b.tagName)) return 1;
  if (b.directDependents.includes(a.tagName)) return -1;

  if (a.directDependencies.includes(b.tagName)) return 1;
  if (b.directDependencies.includes(a.tagName)) return -1;

  if (a.dependents.includes(b.tagName)) return 1;
  if (b.dependents.includes(a.tagName)) return -1;

  if (a.dependencies.includes(b.tagName)) return 1;
  if (b.dependencies.includes(a.tagName)) return -1;

  if (a.dependents.length < b.dependents.length) return -1;
  if (a.dependents.length > b.dependents.length) return 1;

  if (a.dependencies.length > b.dependencies.length) return -1;
  if (a.dependencies.length < b.dependencies.length) return 1;

  if (a.tagName < b.tagName) return -1;
  if (a.tagName > b.tagName) return 1;

  return 0;
};

const convertChunk = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  sourceTarget: d.SourceTarget,
  shouldMinify: boolean,
  isCore: boolean,
  isBrowserBuild: boolean,
  code: string,
  rollupSrcMap: RollupSourceMap,
) => {
  let sourceMap = rollupToStencilSourceMap(rollupSrcMap);
  const inlineHelpers = isBrowserBuild || !hasDependency(buildCtx, 'tslib');
  const optimizeResults = await optimizeModule(config, compilerCtx, {
    input: code,
    sourceMap,
    isCore,
    sourceTarget,
    inlineHelpers,
    minify: shouldMinify,
  });
  buildCtx.diagnostics.push(...optimizeResults.diagnostics);

  if (typeof optimizeResults.output === 'string') {
    code = optimizeResults.output;
  }

  if (optimizeResults.sourceMap) {
    sourceMap = optimizeResults.sourceMap;
  }
  return { code, sourceMap };
};

import ts from 'typescript';
import type * as d from '@stencil/core';

import {
  catchError,
  COLLECTION_APP_DATA_FILE_NAME,
  COLLECTION_MANIFEST_FILE_NAME,
  flatOne,
  generatePreamble,
  isOutputTargetCollection,
  join,
  normalizePath,
  relative,
  sortBy,
} from '../../../utils';
import { version, versions } from '../../../version';
import { getBuildFeatures } from '../../app-core/app-data';
import { mapImportsToPathAliases } from '../../transformers/map-imports-to-path-aliases';

/**
 * Main output target function for `collection`.
 *
 * This function takes the compiled output from a {@link ts.Program}, runs each file through
 * a transformer to transpile import path aliases, and then writes the output code and source
 * maps to disk in the specified collection directory.
 *
 * The collection output contains component source code, metadata, and configuration
 * for downstream Stencil projects to re-compile and bundle.
 *
 * @param config The validated Stencil config.
 * @param compilerCtx The current compiler context.
 * @param buildCtx The current build context.
 * @param changedModuleFiles The changed modules returned from the TS compiler.
 * @returns An empty promise. Resolved once all functions finish.
 */
export const outputCollection = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  changedModuleFiles: d.Module[],
): Promise<void> => {
  const outputTargets = config.outputTargets.filter(isOutputTargetCollection);
  if (outputTargets.length === 0) {
    return;
  }

  const bundlingEventMessage = `generate collection${config.sourceMap ? ' + source maps' : ''}`;
  const timespan = buildCtx.createTimeSpan(`${bundlingEventMessage} started`, true);
  try {
    await Promise.all(
      changedModuleFiles.map(async (mod) => {
        let code = mod.staticSourceFileText;
        if (config.preamble) {
          code = `${generatePreamble(config)}\n${code}`;
        }
        const mapCode = mod.sourceMapFileText;

        await Promise.all(
          outputTargets.map(async (target) => {
            const relPath = relative(config.srcDir, mod.jsFilePath);
            const filePath = join(target.dir, relPath);

            // Transpile the already transpiled modules to apply
            // a transformer to convert aliased import paths to relative paths
            // We run this even if the transformer will perform no action
            // to avoid race conditions between multiple output targets that
            // may be writing to the same location
            const { outputText } = ts.transpileModule(code, {
              fileName: mod.sourceFilePath,
              compilerOptions: {
                target: ts.ScriptTarget.Latest,
              },
              transformers: {
                after: [mapImportsToPathAliases(config, filePath, target)],
              },
            });

            await compilerCtx.fs.writeFile(filePath, outputText, { outputTargetType: target.type });

            if (mod.sourceMapPath) {
              const relativeSourceMapPath = relative(config.srcDir, mod.sourceMapPath);
              const sourceMapOutputFilePath = join(target.dir, relativeSourceMapPath);
              await compilerCtx.fs.writeFile(sourceMapOutputFilePath, mapCode, {
                outputTargetType: target.type,
              });
            }
          }),
        );
      }),
    );

    await writeCollectionManifests(config, compilerCtx, buildCtx, outputTargets);
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }

  timespan.finish(`${bundlingEventMessage} finished`);
};

const writeCollectionManifests = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetCollection[],
) => {
  const manifest = serializeCollectionManifest(config, compilerCtx, buildCtx);
  const collectionData = JSON.stringify(manifest, null, 2);
  const appDataModule = generateAppDataModule(manifest.buildFlags ?? {}, config);
  return Promise.all(
    outputTargets.map((o) => writeCollectionOutput(compilerCtx, collectionData, appDataModule, o)),
  );
};

// This maps the JSON data to our internal data structure.
// Mapping is so that the internal data structure "could" change,
// but the external user data will always use the same API.
// These mapping functions loosely couple core component metadata
// between specific versions of the compiler.
const writeCollectionOutput = async (
  compilerCtx: d.CompilerCtx,
  collectionData: string,
  appDataModule: string,
  outputTarget: d.OutputTargetCollection,
) => {
  const { dir } = outputTarget;
  await Promise.all([
    compilerCtx.fs.writeFile(join(dir, COLLECTION_MANIFEST_FILE_NAME), collectionData),
    compilerCtx.fs.writeFile(join(dir, COLLECTION_APP_DATA_FILE_NAME), appDataModule),
  ]);
};

const generateAppDataModule = (build: d.BuildConditionals, config: d.ValidatedConfig): string => {
  // JSON.stringify omits undefined fields — missing flags are treated as false by the runtime.
  const buildStr = JSON.stringify(build, null, 2);
  const envStr = JSON.stringify(config.env ?? {});
  const ns = JSON.stringify(config.fsNamespace);
  return `export const BUILD = ${buildStr};\nexport const Env = ${envStr};\nexport const NAMESPACE = ${ns};\n`;
};

const serializeCollectionManifest = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  const localCmps = buildCtx.moduleFiles
    .filter((mod) => !mod.isCollectionDependency)
    .flatMap((mod) => mod.cmps);

  const buildFlags = getBuildFeatures(localCmps) as d.BuildConditionals;

  // Apply config-driven runtime extras (not build-mode flags like isDev/isTesting)
  const ldp = config.extras?.lightDomPatches ?? true;
  if (buildFlags.slotRelocation && ldp !== false) {
    buildFlags.lightDomPatches = ldp === true;
    buildFlags.slotChildNodes = ldp === true || (typeof ldp === 'object' && !!ldp.childNodes);
    buildFlags.slotCloneNode = typeof ldp === 'object' && !!ldp.cloneNode;
    buildFlags.slotDomMutations = ldp === true || (typeof ldp === 'object' && !!ldp.domMutations);
    buildFlags.slotTextContent = ldp === true || (typeof ldp === 'object' && !!ldp.textContent);
  } else {
    buildFlags.lightDomPatches = false;
    buildFlags.slotChildNodes = false;
    buildFlags.slotCloneNode = false;
    buildFlags.slotDomMutations = false;
    buildFlags.slotTextContent = false;
  }
  buildFlags.lifecycleDOMEvents = !!config.extras?.lifecycleDOMEvents;
  buildFlags.initializeNextTick = !!config.extras?.initializeNextTick;
  buildFlags.asyncQueue = config.taskQueue === 'congestionAsync';

  // Hydration marker — consumers must know which selector the lib used so @stencil/vitest
  // and other tooling can detect when components are ready. Defaults to class-based.
  if (config.hydratedFlag) {
    buildFlags.hydratedAttribute = config.hydratedFlag.selector === 'attribute';
    buildFlags.hydratedClass = config.hydratedFlag.selector === 'class';
    if (config.hydratedFlag.name) buildFlags.hydratedSelectorName = config.hydratedFlag.name;
  } else {
    buildFlags.hydratedClass = true;
  }
  buildFlags.invisiblePrehydration =
    typeof config.invisiblePrehydration === 'undefined' ? true : config.invisiblePrehydration;
  // constructableCSS is only false during HMR dev mode — always true in distributed output
  buildFlags.constructableCSS = true;
  // cssAnnotations gates addHydratedFlag (asyncLoading && cssAnnotations) — always true
  buildFlags.cssAnnotations = true;

  // create the single collection we're going to fill up with data
  const collectionManifest: d.CollectionManifest = {
    entries: buildCtx.moduleFiles
      .filter((mod) => !mod.isCollectionDependency && mod.cmps.length > 0)
      .map((mod) => relative(config.srcDir, mod.jsFilePath)),
    // Include mixin/abstract class modules that can be extended by consuming projects
    // These are modules with Stencil static members but no @Component decorator
    mixins: buildCtx.moduleFiles
      .filter(
        (mod) => !mod.isCollectionDependency && mod.hasExportableMixins && mod.cmps.length === 0,
      )
      .map((mod) => relative(config.srcDir, mod.jsFilePath)),
    compiler: {
      name: '@stencil/core',
      version,
      typescriptVersion: versions.typescript,
    },
    collections: serializeCollectionDependencies(compilerCtx),
    bundles: config.bundles.map((b) => ({
      components: b.components.slice().sort(),
    })),
    buildFlags,
  };
  if (config.globalScript) {
    const mod = compilerCtx.moduleMap.get(normalizePath(config.globalScript));
    if (mod) {
      collectionManifest.global = relative(config.srcDir, mod.jsFilePath);
    }
  }
  return collectionManifest;
};

const serializeCollectionDependencies = (
  compilerCtx: d.CompilerCtx,
): d.CollectionDependencyData[] => {
  const collectionDeps = compilerCtx.collections.map((c) => ({
    name: c.collectionName,
    tags: flatOne(c.moduleFiles.map((m) => m.cmps))
      .map((cmp) => cmp.tagName)
      .sort(),
  }));

  return sortBy(collectionDeps, (item) => item.name);
};

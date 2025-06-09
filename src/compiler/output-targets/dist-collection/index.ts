import {
  catchError,
  COLLECTION_MANIFEST_FILE_NAME,
  flatOne,
  generatePreamble,
  isOutputTargetDistCollection,
  join,
  normalizePath,
  relative,
  sortBy,
} from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { typescriptVersion, version } from '../../../version';
import { mapImportsToPathAliases } from '../../transformers/map-imports-to-path-aliases';

/**
 * Main output target function for `dist-collection`. This function takes the compiled output from a
 * {@link ts.Program}, runs each file through a transformer to transpile import path aliases, and then writes
 * the output code and source maps to disk in the specified collection directory.
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
  const outputTargets = config.outputTargets.filter(isOutputTargetDistCollection);
  if (outputTargets.length === 0) {
    return;
  }

  const bundlingEventMessage = `generate collections${config.sourceMap ? ' + source maps' : ''}`;
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
            const filePath = join(target.collectionDir, relPath);

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
              const sourceMapOutputFilePath = join(target.collectionDir, relativeSourceMapPath);
              await compilerCtx.fs.writeFile(sourceMapOutputFilePath, mapCode, { outputTargetType: target.type });
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
  outputTargets: d.OutputTargetDistCollection[],
) => {
  const collectionData = JSON.stringify(serializeCollectionManifest(config, compilerCtx, buildCtx), null, 2);
  return Promise.all(outputTargets.map((o) => writeCollectionManifest(compilerCtx, collectionData, o)));
};

// this maps the json data to our internal data structure
// mapping is so that the internal data structure "could"
// change, but the external user data will always use the same api
// over the top lame mapping functions is basically so we can loosely
// couple core component meta data between specific versions of the compiler
const writeCollectionManifest = async (
  compilerCtx: d.CompilerCtx,
  collectionData: string,
  outputTarget: d.OutputTargetDistCollection,
) => {
  // get the absolute path to the directory where the collection will be saved
  const { collectionDir } = outputTarget;

  // create an absolute file path to the actual collection json file
  const collectionFilePath = join(collectionDir, COLLECTION_MANIFEST_FILE_NAME);

  // don't bother serializing/writing the collection if we're not creating a distribution
  await compilerCtx.fs.writeFile(collectionFilePath, collectionData);
};

const serializeCollectionManifest = (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  // create the single collection we're going to fill up with data
  const collectionManifest: d.CollectionManifest = {
    entries: buildCtx.moduleFiles
      .filter((mod) => !mod.isCollectionDependency && mod.cmps.length > 0)
      .map((mod) => relative(config.srcDir, mod.jsFilePath)),
    compiler: {
      name: '@stencil/core',
      version,
      typescriptVersion,
    },
    collections: serializeCollectionDependencies(compilerCtx),
    bundles: config.bundles.map((b) => ({
      components: b.components.slice().sort(),
    })),
  };
  if (config.globalScript) {
    const mod = compilerCtx.moduleMap.get(normalizePath(config.globalScript));
    if (mod) {
      collectionManifest.global = relative(config.srcDir, mod.jsFilePath);
    }
  }
  return collectionManifest;
};

const serializeCollectionDependencies = (compilerCtx: d.CompilerCtx): d.CollectionDependencyData[] => {
  const collectionDeps = compilerCtx.collections.map((c) => ({
    name: c.collectionName,
    tags: flatOne(c.moduleFiles.map((m) => m.cmps))
      .map((cmp) => cmp.tagName)
      .sort(),
  }));

  return sortBy(collectionDeps, (item) => item.name);
};

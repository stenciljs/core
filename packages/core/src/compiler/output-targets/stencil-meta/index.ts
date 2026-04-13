import ts from 'typescript';
import type * as d from '@stencil/core';

import {
  catchError,
  COLLECTION_MANIFEST_FILE_NAME,
  flatOne,
  generatePreamble,
  isOutputTargetStencilMeta,
  join,
  normalizePath,
  relative,
  sortBy,
} from '../../../utils';
import { version, versions } from '../../../version';
import { mapImportsToPathAliases } from '../../transformers/map-imports-to-path-aliases';

/**
 * Main output target function for `stencil-meta`.
 *
 * This function takes the compiled output from a {@link ts.Program}, runs each file through
 * a transformer to transpile import path aliases, and then writes the output code and source
 * maps to disk in the specified stencil-meta directory.
 *
 * The stencil-meta output contains component metadata, transpiled source, and configuration
 * for downstream Stencil projects to consume.
 *
 * @param config The validated Stencil config.
 * @param compilerCtx The current compiler context.
 * @param buildCtx The current build context.
 * @param changedModuleFiles The changed modules returned from the TS compiler.
 * @returns An empty promise. Resolved once all functions finish.
 */
export const outputStencilMeta = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  changedModuleFiles: d.Module[],
): Promise<void> => {
  const outputTargets = config.outputTargets.filter(isOutputTargetStencilMeta);
  if (outputTargets.length === 0) {
    return;
  }

  const bundlingEventMessage = `generate stencil-meta${config.sourceMap ? ' + source maps' : ''}`;
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

    await writeStencilMetaManifests(config, compilerCtx, buildCtx, outputTargets);
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }

  timespan.finish(`${bundlingEventMessage} finished`);
};

const writeStencilMetaManifests = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetStencilMeta[],
) => {
  const collectionData = JSON.stringify(
    serializeCollectionManifest(config, compilerCtx, buildCtx),
    null,
    2,
  );
  return Promise.all(
    outputTargets.map((o) => writeStencilMetaManifest(compilerCtx, collectionData, o)),
  );
};

// This maps the JSON data to our internal data structure.
// Mapping is so that the internal data structure "could" change,
// but the external user data will always use the same API.
// These mapping functions loosely couple core component metadata
// between specific versions of the compiler.
const writeStencilMetaManifest = async (
  compilerCtx: d.CompilerCtx,
  collectionData: string,
  outputTarget: d.OutputTargetStencilMeta,
) => {
  // Get the absolute path to the directory where the stencil-meta will be saved
  const { dir } = outputTarget;

  // Create an absolute file path to the actual collection manifest json file
  const collectionFilePath = join(dir, COLLECTION_MANIFEST_FILE_NAME);

  // don't bother serializing/writing the collection if we're not creating a distribution
  await compilerCtx.fs.writeFile(collectionFilePath, collectionData);
};

const serializeCollectionManifest = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
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

/**
 * @deprecated Use outputStencilMeta instead. This alias will be removed in v6.
 */
export const outputCollection = outputStencilMeta;

import type * as d from '@stencil/core';

import { outputCollection } from './collection';
import { outputCopy } from './copy/output-copy';
import { outputLazy } from './dist-lazy/lazy-output';
import { outputAssets } from './output-assets';
import { outputCustom } from './output-custom';
import { outputDocs } from './output-docs';
import { outputGlobalStyle } from './output-global-style';
import { outputTypes } from './output-types';
import { outputWww } from './output-www';
import { outputSsr } from './ssr';
import { outputSsrWasm } from './ssr-wasm';
import { outputStandalone } from './standalone';

export const generateOutputTargets = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
) => {
  const timeSpan = buildCtx.createTimeSpan('generate outputs started', true);

  const changedModuleFiles = Array.from(compilerCtx.changedModules)
    .map((filename) => compilerCtx.moduleMap.get(filename))
    .filter((mod) => mod && !mod.isCollectionDependency);

  // Evict transpile cache entries for re-emitted modules (keys are "bundleId:filePath").
  // Must run before changedModules.clear().
  if (compilerCtx.changedModules.size > 0) {
    for (const [key] of compilerCtx.transpileCache) {
      const colon = key.indexOf(':');
      if (colon !== -1 && compilerCtx.changedModules.has(key.slice(colon + 1))) {
        compilerCtx.transpileCache.delete(key);
      }
    }
  }

  // Evict CSS transform cache entries for changed style files.
  // Keys are the annotated import path e.g. "/path/foo.scss?tag=ion-foo&mode=md&…".
  // Two cases:
  //  1. The entry file itself changed (key base path matches).
  //  2. A SASS @import/@use dependency changed (in pluginTransformDependencies).
  if (buildCtx.hasStyleChanges && buildCtx.filesChanged.length > 0) {
    const changedStyleFiles = new Set(buildCtx.filesChanged);
    for (const [key, entry] of compilerCtx.cssTransformCache) {
      const basePath = key.includes('?') ? key.slice(0, key.indexOf('?')) : key;
      const entryFileChanged = changedStyleFiles.has(basePath);
      const depChanged =
        !entryFileChanged &&
        entry != null &&
        entry.pluginTransformDependencies.some((dep) => changedStyleFiles.has(dep));
      if (entryFileChanged || depChanged) {
        compilerCtx.cssTransformCache.delete(key);
      }
    }
  }

  compilerCtx.changedModules.clear();

  invalidateRolldownCaches(compilerCtx);

  // Skip bundler outputs on rebuilds where only HTML/assets changed — output would be identical.
  const needsBundlerRebuild =
    !buildCtx.isRebuild || buildCtx.hasScriptChanges || buildCtx.hasStyleChanges;

  const bundlerTasks: Promise<void>[] = needsBundlerRebuild
    ? [
        outputStandalone(config, compilerCtx, buildCtx),
        outputLazy(config, compilerCtx, buildCtx),
        outputSsr(config, compilerCtx, buildCtx),
        outputSsrWasm(config, compilerCtx, buildCtx),
      ]
    : [];

  await Promise.all([
    // outputCollection is already a no-op when changedModuleFiles is empty.
    outputCollection(config, compilerCtx, buildCtx, changedModuleFiles),
    ...bundlerTasks,
  ]);

  await Promise.all([
    // Global styles and assets output (unified dist/assets/ location)
    outputGlobalStyle(config, compilerCtx, buildCtx),
    outputAssets(config, compilerCtx, buildCtx),

    // the user may want to copy compiled assets which requires above tasks to
    // have finished first
    outputCopy(config, compilerCtx, buildCtx),

    // the www output target depends on the output of the lazy output target
    // since it attempts to inline the lazy build entry point into `index.html`
    // so we want to ensure that the lazy OT has already completed and written
    // all of its files before the www OT runs.
    outputWww(config, compilerCtx, buildCtx),

    // Types, docs and custom outputs are metadata-derived; skip when nothing script/style changed.
    ...(needsBundlerRebuild
      ? [
          outputDocs(config, compilerCtx, buildCtx),
          outputTypes(config, compilerCtx, buildCtx),
          outputCustom(config, compilerCtx, buildCtx),
        ]
      : []),
  ]);

  timeSpan.finish('generate outputs finished');
};

const invalidateRolldownCaches = (compilerCtx: d.CompilerCtx) => {
  const invalidatedIds = compilerCtx.changedFiles;
  compilerCtx.rolldownCache.forEach((cache: any) => {
    if (cache?.modules) {
      cache.modules.forEach((mod: any) => {
        if (mod?.transformDependencies?.some((id: string) => invalidatedIds.has(id))) {
          mod.originalCode = null;
        }
      });
    }
  });
};

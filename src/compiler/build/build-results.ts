import { fromEntries, hasError, isString, normalizeDiagnostics } from '@utils';

import type * as d from '../../declarations';
import { getBuildTimestamp } from './build-ctx';
import { generateHmr } from './build-hmr';

export const generateBuildResults = (config: d.Config, compilerCtx: d.CompilerCtx, buildCtx: d.BuildCtx) => {
  const componentGraph = buildCtx.componentGraph ? fromEntries(buildCtx.componentGraph.entries()) : undefined;

  const buildResults: d.CompilerBuildResults = {
    buildId: buildCtx.buildId,
    diagnostics: normalizeDiagnostics(compilerCtx, buildCtx.diagnostics),
    dirsAdded: buildCtx.dirsAdded.slice().sort(),
    dirsDeleted: buildCtx.dirsDeleted.slice().sort(),
    duration: Date.now() - buildCtx.startTime,
    filesAdded: buildCtx.filesAdded.slice().sort(),
    filesChanged: buildCtx.filesChanged.slice().sort(),
    filesDeleted: buildCtx.filesDeleted.slice().sort(),
    filesUpdated: buildCtx.filesUpdated.slice().sort(),
    hasError: hasError(buildCtx.diagnostics),
    hasSuccessfulBuild: compilerCtx.hasSuccessfulBuild,
    isRebuild: buildCtx.isRebuild,
    namespace: config.namespace,
    outputs: compilerCtx.fs.getBuildOutputs(),
    rootDir: config.rootDir,
    srcDir: config.srcDir,
    timestamp: getBuildTimestamp(),
    componentGraph,
  };

  const hmr = generateHmr(config, compilerCtx, buildCtx);
  if (hmr != null) {
    buildResults.hmr = hmr;
  }

  if (isString(buildCtx.hydrateAppFilePath)) {
    buildResults.hydrateAppFilePath = buildCtx.hydrateAppFilePath;
  }

  compilerCtx.lastBuildResults = Object.assign({}, buildResults as any);

  return buildResults;
};

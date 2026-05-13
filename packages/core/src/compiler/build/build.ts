import { createDocument } from '@stencil/mock-doc';
import ts from 'typescript';
import type * as d from '@stencil/core';

import { catchError, isString, join, readPackageJson } from '../../utils';
import { generateOutputTargets } from '../output-targets';
import { emptyOutputTargets } from '../output-targets/empty-dir';
import { generateGlobalStyles } from '../style/global-styles';
import { ingestConfigCollections } from '../transformers/collection/add-external-import';
import { resetDeprecatedApiWarning } from '../transformers/decorators-to-static/component-decorator';
import { runTsProgram, validateTypesAfterGeneration } from '../transpile/run-program';
import { buildAbort, buildFinish } from './build-finish';
import { writeBuild } from './write-build';

export const build = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  tsBuilder: ts.BuilderProgram,
) => {
  try {
    // reset process.cwd() for 3rd-party plugins
    process.chdir(config.rootDir);

    // reset the deprecated API warning flag for this build
    resetDeprecatedApiWarning();

    // empty the directories on the first build
    await emptyOutputTargets(config, compilerCtx, buildCtx);
    if (buildCtx.hasError) return buildAbort(buildCtx);

    if (config.srcIndexHtml) {
      const indexSrcHtml = await compilerCtx.fs.readFile(config.srcIndexHtml);
      if (isString(indexSrcHtml)) {
        buildCtx.indexDoc = createDocument(indexSrcHtml);
      }
    }

    if (config.sys.glob) {
      const htmlFiles = await config.sys.glob('**/*.html', { cwd: config.srcDir, nodir: true });
      buildCtx.htmlDocs = new Map();
      for (const relPath of htmlFiles) {
        const absPath = join(config.srcDir, relPath);
        if (absPath === config.srcIndexHtml) continue;
        const content = await compilerCtx.fs.readFile(absPath);
        if (isString(content)) {
          buildCtx.htmlDocs.set(relPath, createDocument(content));
        }
      }
    }

    await readPackageJson(config, compilerCtx, buildCtx);
    if (buildCtx.hasError) return buildAbort(buildCtx);

    // proactively ingest any collections declared in config.collections
    ingestConfigCollections(config, compilerCtx, buildCtx);

    // run typescript program
    const tsTimeSpan = buildCtx.createTimeSpan('transpile started');
    const emittedDts = await runTsProgram(config, compilerCtx, buildCtx, tsBuilder);
    tsTimeSpan.finish('transpile finished');
    if (buildCtx.hasError) return buildAbort(buildCtx);

    // If TS emitted nothing, the "script change" was a phantom duplicate event — clear the flag
    // so type validation and bundling are skipped.
    if (buildCtx.isRebuild && buildCtx.hasScriptChanges && compilerCtx.changedModules.size === 0) {
      buildCtx.hasScriptChanges = false;
    }

    // Skip type validation on rebuilds with no script changes — the type graph is unchanged.
    const skipTypeValidation = buildCtx.isRebuild && !buildCtx.hasScriptChanges;

    if (!skipTypeValidation) {
      const { needsRebuild } = await validateTypesAfterGeneration(
        config,
        compilerCtx,
        buildCtx,
        tsBuilder,
        emittedDts,
      );
      if (buildCtx.hasError) return buildAbort(buildCtx);

      if (needsRebuild) {
        // components.d.ts was just created; the current TS program lacks it.
        // Return null so watch-build restarts with a fresh program.
        return null;
      }
      // types changed but no restart needed — components.d.ts is watch-ignored
      // to prevent cascade rebuilds, so just continue with the current build.
    }

    // preprocess and generate styles before any outputTarget starts
    buildCtx.stylesPromise = generateGlobalStyles(config, compilerCtx, buildCtx);
    if (buildCtx.hasError) return buildAbort(buildCtx);

    // create outputs
    await generateOutputTargets(config, compilerCtx, buildCtx);
    if (buildCtx.hasError) return buildAbort(buildCtx);

    // write outputs
    await buildCtx.stylesPromise;
    await writeBuild(config, compilerCtx, buildCtx);
  } catch (e: any) {
    // ¯\_(ツ)_/¯
    catchError(buildCtx.diagnostics, e);
  }

  // clear changed files
  compilerCtx.changedFiles.clear();

  // return what we've learned today
  return buildFinish(buildCtx);
};

import { createDocument } from '@stencil/mock-doc';
import { catchError, isString, readPackageJson } from '../../utils';
import ts from 'typescript';

import type * as d from '@stencil/core';
import { generateOutputTargets } from '../output-targets';
import { emptyOutputTargets } from '../output-targets/empty-dir';
import { generateGlobalStyles } from '../style/global-styles';
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

    // empty the directories on the first build
    await emptyOutputTargets(config, compilerCtx, buildCtx);
    if (buildCtx.hasError) return buildAbort(buildCtx);

    if (config.srcIndexHtml) {
      const indexSrcHtml = await compilerCtx.fs.readFile(config.srcIndexHtml);
      if (isString(indexSrcHtml)) {
        buildCtx.indexDoc = createDocument(indexSrcHtml);
      }
    }

    await readPackageJson(config, compilerCtx, buildCtx);
    if (buildCtx.hasError) return buildAbort(buildCtx);

    // run typescript program
    const tsTimeSpan = buildCtx.createTimeSpan('transpile started');
    const emittedDts = await runTsProgram(config, compilerCtx, buildCtx, tsBuilder);
    tsTimeSpan.finish('transpile finished');
    if (buildCtx.hasError) return buildAbort(buildCtx);

    // generate types and validate AFTER components.d.ts is written
    const componentDtsChanged = await validateTypesAfterGeneration(
      config,
      compilerCtx,
      buildCtx,
      tsBuilder,
      emittedDts,
    );
    if (buildCtx.hasError) return buildAbort(buildCtx);

    if (config.watch && componentDtsChanged) {
      // silent abort for watch mode only
      return null;
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

  // TODO
  // clear changed files
  compilerCtx.changedFiles.clear();

  // return what we've learned today
  return buildFinish(buildCtx);
};

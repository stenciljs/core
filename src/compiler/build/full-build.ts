import ts from 'typescript';

import type * as d from '../../declarations';
import { createTsBuildProgram } from '../transpile/create-build-program';
import { build } from './build';
import { BuildContext } from './build-ctx';

/**
 * Build a callable function to perform a full build of a Stencil project
 * @param config a Stencil configuration to apply to a full build of a Stencil project
 * @param compilerCtx the current Stencil compiler context
 * @returns the results of a full build of Stencil
 */
export const createFullBuild = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
): Promise<d.CompilerBuildResults> => {
  return new Promise<d.CompilerBuildResults>((resolve) => {
    let tsWatchProgram: ts.WatchOfConfigFile<ts.BuilderProgram> = null;

    compilerCtx.events.on('fileUpdate', (p) => {
      config.logger.debug(`fileUpdate: ${p}`);
      compilerCtx.fs.clearFileCache(p);
    });

    /**
     * A function that kicks off the transpilation process for both the TypeScript and Stencil compilers
     * @param tsBuilder the manager of the {@link ts.Program} state
     */
    const onBuild = async (tsBuilder: ts.BuilderProgram): Promise<void> => {
      const buildCtx = new BuildContext(config, compilerCtx);
      buildCtx.isRebuild = false;
      buildCtx.requiresFullBuild = true;
      buildCtx.start();

      const result = await build(config, compilerCtx, buildCtx, tsBuilder);
      if (result !== null) {
        if (tsWatchProgram) {
          tsWatchProgram.close();
          tsWatchProgram = null;
        }
        resolve(result);
      }
    };

    createTsBuildProgram(config, onBuild).then((program) => {
      tsWatchProgram = program;
    });
  });
};

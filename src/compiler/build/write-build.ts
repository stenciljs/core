import { catchError, isOutputTargetDistCustomElements, isOutputTargetDistLazyLoader } from '@utils';
import { relative } from '@utils';
import { execSync } from 'child_process';

import * as d from '../../declarations';
import { outputServiceWorkers } from '../output-targets/output-service-workers';
import { validateBuildFiles } from './validate-files';

/**
 * Writes files to disk as a result of compilation
 * @param config the Stencil configuration used for the build
 * @param compilerCtx the compiler context associated with the build
 * @param buildCtx the build context associated with the current build
 */
export const writeBuild = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<void> => {
  const timeSpan = buildCtx.createTimeSpan(`writeBuildFiles started`, true);

  let totalFilesWrote = 0;

  try {
    // commit all the `writeFile`, `mkdir`, `rmdir` and `unlink` operations to disk
    const commitResults = await compilerCtx.fs.commit();

    // get the results from the write to disk commit
    buildCtx.filesWritten = commitResults.filesWritten;
    buildCtx.filesDeleted = commitResults.filesDeleted;
    buildCtx.dirsDeleted = commitResults.dirsDeleted;
    buildCtx.dirsAdded = commitResults.dirsAdded;
    totalFilesWrote = commitResults.filesWritten.length;

    // successful write
    // kick off writing the cached file stuff
    await compilerCtx.cache.commit();
    buildCtx.debug(`in-memory-fs: ${compilerCtx.fs.getMemoryStats()}`);
    buildCtx.debug(`cache: ${compilerCtx.cache.getMemoryStats()}`);

    if (config.generateExportMaps) {
      writeExportMaps(config, buildCtx);
    }

    await outputServiceWorkers(config, buildCtx);
    await validateBuildFiles(config, compilerCtx, buildCtx);
  } catch (e: any) {
    catchError(buildCtx.diagnostics, e);
  }

  timeSpan.finish(`writeBuildFiles finished, files wrote: ${totalFilesWrote}`);
};

/**
 * Create export map entry point definitions for the `package.json` file using the npm CLI.
 * This will generate a root entry point for the package, as well as entry points for each component and
 * the lazy loader (if applicable).
 *
 * @param config The validated Stencil config
 * @param buildCtx The build context containing the components to generate export maps for
 */
const writeExportMaps = (config: d.ValidatedConfig, buildCtx: d.BuildCtx) => {
  const namespace = buildCtx.config.fsNamespace;

  execSync(`npm pkg set "exports[.][import]"="./dist/${namespace}/${namespace}.esm.js"`);
  execSync(`npm pkg set "exports[.][require]"="./dist/${namespace}/${namespace}.cjs.js"`);

  const distLazyLoader = config.outputTargets.find(isOutputTargetDistLazyLoader);
  if (distLazyLoader != null) {
    // Calculate relative path from project root to lazy-loader output directory
    let outDir = relative(config.rootDir, distLazyLoader.dir);
    if (!outDir.startsWith('.')) {
      outDir = './' + outDir;
    }

    execSync(`npm pkg set "exports[./loader][import]"="${outDir}/index.js"`);
    execSync(`npm pkg set "exports[./loader][require]"="${outDir}/index.cjs"`);
    execSync(`npm pkg set "exports[./loader][types]"="${outDir}/index.d.ts"`);
  }

  const distCustomElements = config.outputTargets.find(isOutputTargetDistCustomElements);
  if (distCustomElements != null) {
    // Calculate relative path from project root to custom elements output directory
    let outDir = relative(config.rootDir, distCustomElements.dir);
    if (!outDir.startsWith('.')) {
      outDir = './' + outDir;
    }

    buildCtx.components.forEach((cmp) => {
      console.log('path', cmp.jsFilePath);
      execSync(`npm pkg set "exports[./${cmp.tagName}][import]"="${outDir}/${cmp.tagName}.js"`);

      if (distCustomElements.generateTypeDeclarations) {
        execSync(`npm pkg set "exports[./${cmp.tagName}][types]"="${outDir}/${cmp.tagName}.d.ts"`);
      }
    });
  }
};

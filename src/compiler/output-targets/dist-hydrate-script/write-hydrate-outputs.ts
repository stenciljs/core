import { join } from '@utils';
import { basename } from 'path';
import type { RollupOutput } from 'rollup';

import type * as d from '../../../declarations';
import { MODE_RESOLUTION_CHAIN_DECLARATION } from './hydrate-factory-closure';
import { relocateHydrateContextConst } from './relocate-hydrate-context';

export const writeHydrateOutputs = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetHydrate[],
  rollupOutput: RollupOutput,
) => {
  return Promise.all(
    outputTargets.map((outputTarget) => {
      return writeHydrateOutput(config, compilerCtx, buildCtx, outputTarget, rollupOutput);
    }),
  );
};

const writeHydrateOutput = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetHydrate,
  rollupOutput: RollupOutput,
) => {
  const hydratePackageName = await getHydratePackageName(config, compilerCtx);

  const hydrateAppDirPath = outputTarget.dir;
  if (!hydrateAppDirPath) {
    throw new Error(`outputTarget config missing the "dir" property`);
  }

  const hydrateCoreIndexPath = join(hydrateAppDirPath, 'index.js');
  const hydrateCoreIndexPathESM = join(hydrateAppDirPath, 'index.mjs');
  const hydrateCoreIndexDtsFilePath = join(hydrateAppDirPath, 'index.d.ts');

  const pkgJsonPath = join(hydrateAppDirPath, 'package.json');
  const pkgJsonCode = getHydratePackageJson(
    config,
    hydrateCoreIndexPath,
    hydrateCoreIndexPathESM,
    hydrateCoreIndexDtsFilePath,
    hydratePackageName,
  );

  await Promise.all([
    copyHydrateRunnerDts(config, compilerCtx, hydrateAppDirPath),
    compilerCtx.fs.writeFile(pkgJsonPath, pkgJsonCode),
  ]);

  // always remember a path to the hydrate app that the prerendering may need later on
  buildCtx.hydrateAppFilePath = hydrateCoreIndexPath;

  await Promise.all(
    rollupOutput.output.map(async (output) => {
      if (output.type === 'chunk') {
        output.code = relocateHydrateContextConst(config, compilerCtx, output.code);

        /**
         * Enable the line where we define `modeResolutionChain` for the hydrate module.
         */
        output.code = output.code.replace(
          `// const ${MODE_RESOLUTION_CHAIN_DECLARATION}`,
          `const ${MODE_RESOLUTION_CHAIN_DECLARATION}`,
        );

        const filePath = join(hydrateAppDirPath, output.fileName);
        await compilerCtx.fs.writeFile(filePath, output.code, { immediateWrite: true });
      }
    }),
  );
};

const getHydratePackageJson = (
  config: d.ValidatedConfig,
  hydrateAppFilePathCJS: string,
  hydrateAppFilePathESM: string,
  hydrateDtsFilePath: string,
  hydratePackageName: string,
) => {
  const pkg: d.PackageJsonData = {
    name: hydratePackageName,
    description: `${config.namespace} component hydration app.`,
    main: basename(hydrateAppFilePathCJS),
    types: basename(hydrateDtsFilePath),
    exports: {
      '.': {
        require: `./${basename(hydrateAppFilePathCJS)}`,
        import: `./${basename(hydrateAppFilePathESM)}`,
      },
    },
  };
  return JSON.stringify(pkg, null, 2);
};

const getHydratePackageName = async (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx) => {
  const directoryName = basename(config.rootDir);
  try {
    const rootPkgFilePath = join(config.rootDir, 'package.json');
    const pkgStr = await compilerCtx.fs.readFile(rootPkgFilePath);
    const pkgData = JSON.parse(pkgStr) as d.PackageJsonData;
    const scope = pkgData.name || directoryName;
    return `${scope}/hydrate`;
  } catch (e) {}

  return `${config.fsNamespace || directoryName}/hydrate`;
};

const copyHydrateRunnerDts = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  hydrateAppDirPath: string,
) => {
  const packageDir = join(config.sys.getCompilerExecutingPath(), '..', '..');
  const srcHydrateDir = join(packageDir, 'internal', 'hydrate', 'runner.d.ts');

  const runnerDtsDestPath = join(hydrateAppDirPath, 'index.d.ts');

  await compilerCtx.fs.copyFile(srcHydrateDir, runnerDtsDestPath);
};

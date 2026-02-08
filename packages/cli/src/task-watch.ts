import type { DevServer, ValidatedConfig } from '../declarations';
import { printCheckVersionResults, startCheckVersion } from './check-version';
import type { CoreCompiler } from './load-compiler';
import { startupCompilerLog } from './logs';

export const taskWatch = async (coreCompiler: CoreCompiler, config: ValidatedConfig) => {
  let devServer: DevServer | null = null;
  let exitCode = 0;

  try {
    startupCompilerLog(coreCompiler, config);

    const versionChecker = startCheckVersion(config, coreCompiler.version);

    const compiler = await coreCompiler.createCompiler(config);
    const watcher = await compiler.createWatcher();

    if (!config.sys.getDevServerExecutingPath || !config.sys.dynamicImport || !config.sys.onProcessInterrupt) {
      throw new Error(
        `Environment doesn't provide required functions: getDevServerExecutingPath, dynamicImport, onProcessInterrupt`,
      );
    }

    if (config.flags.serve) {
      const devServerPath = config.sys.getDevServerExecutingPath();
      const { start }: typeof import('@stencil/core/dev-server') = await config.sys.dynamicImport(devServerPath);
      devServer = await start(config.devServer, config.logger, watcher);
    }

    config.sys.onProcessInterrupt(() => {
      config.logger.debug(`close watch`);
      compiler && compiler.destroy();
    });

    const rmVersionCheckerLog = watcher.on('buildFinish', async () => {
      // log the version check one time
      rmVersionCheckerLog();
      printCheckVersionResults(versionChecker);
    });

    if (devServer) {
      const rmDevServerLog = watcher.on('buildFinish', () => {
        // log the dev server url one time
        rmDevServerLog();
        const url = devServer?.browserUrl ?? 'UNKNOWN URL';
        config.logger.info(`${config.logger.cyan(url)}\n`);
      });
    }

    const closeResults = await watcher.start();
    if (closeResults.exitCode > 0) {
      exitCode = closeResults.exitCode;
    }
  } catch (e) {
    exitCode = 1;
    config.logger.error(e);
  }

  if (devServer) {
    await devServer.close();
  }

  if (exitCode > 0) {
    return config.sys.exit(exitCode);
  }
};

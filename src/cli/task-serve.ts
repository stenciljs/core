import { isString } from '@utils';

import type { ValidatedConfig } from '../declarations';

export const taskServe = async (config: ValidatedConfig) => {
  config.suppressLogs = true;

  config.flags.serve = true;
  config.devServer.openBrowser = !!config.flags.open;
  config.devServer.reloadStrategy = null;
  config.devServer.initialLoadUrl = '/';
  config.devServer.websocket = false;
  config.maxConcurrentWorkers = 1;
  config.devServer.root = isString(config.flags.root) ? config.flags.root : config.sys.getCurrentDirectory();

  if (!config.sys.getDevServerExecutingPath || !config.sys.dynamicImport || !config.sys.onProcessInterrupt) {
    throw new Error(
      `Environment doesn't provide required functions: getDevServerExecutingPath, dynamicImport, onProcessInterrupt`,
    );
  }

  const devServerPath = config.sys.getDevServerExecutingPath();
  const { start }: typeof import('@stencil/core/dev-server') = await config.sys.dynamicImport(devServerPath);
  const devServer = await start(config.devServer, config.logger);

  console.log(`${config.logger.cyan('     Root:')} ${devServer.root}`);
  console.log(`${config.logger.cyan('  Address:')} ${devServer.address}`);
  console.log(`${config.logger.cyan('     Port:')} ${devServer.port}`);
  console.log(`${config.logger.cyan('   Server:')} ${devServer.browserUrl}`);
  console.log(``);

  config.sys.onProcessInterrupt(() => {
    if (devServer) {
      config.logger.debug(`dev server close: ${devServer.browserUrl}`);
      devServer.close();
    }
  });
};

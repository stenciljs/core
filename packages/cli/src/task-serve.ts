import { isString } from '@stencil/core/compiler/utils';
import { start } from '@stencil/dev-server';

import type { ValidatedConfig } from '@stencil/core/compiler';
import type { ConfigFlags } from './config-flags';

export const taskServe = async (config: ValidatedConfig, flags: ConfigFlags) => {
  config.suppressLogs = true;

  config.devServer.openBrowser = !!flags.open;
  config.devServer.reloadStrategy = null;
  config.devServer.initialLoadUrl = '/';
  config.devServer.websocket = false;
  config.maxConcurrentWorkers = 1;
  config.devServer.root = isString(flags.root) ? flags.root : config.sys.getCurrentDirectory();

  if (!config.sys.onProcessInterrupt) {
    throw new Error(`Environment doesn't provide required function: onProcessInterrupt`);
  }

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

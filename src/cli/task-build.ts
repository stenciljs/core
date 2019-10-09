import * as d from '../declarations';
import { Compiler } from '@compiler_legacy';
import { startServer } from '@dev-server';
import { validateCompilerVersion } from './task-version';
import exit from 'exit';


export async function taskBuild(process: NodeJS.Process, config: d.Config, flags: d.ConfigFlags) {
  const compiler = new Compiler(config);
  if (!compiler.isValid) {
    exit(1);
  }

  let devServer: d.DevServer = null;
  if (shouldStartDevServer(config, flags)) {
    try {
      config.devServer.logger = config.logger;
      devServer = await startServer(config.devServer);

      let hasLoggedServerUrl = false;

      compiler.on('buildFinish', buildResults => {
        devServer.emit('buildFinish', buildResults as any);

        if (!hasLoggedServerUrl && !buildResults.hasError) {
          config.logger.info(`dev server: ${config.logger.cyan(devServer.browserUrl)}`);
          hasLoggedServerUrl = true;
        }
      });

      compiler.on('buildLog', buildLog => {
        devServer.emit('buildLog', buildLog);
      });

    } catch (e) {
      config.logger.error(e);
      exit(1);
    }
  }

  let latestVersionPromise: Promise<string>;
  if (config.devMode && config.watch) {
    latestVersionPromise = config.sys.getLatestCompilerVersion(config.logger, false);
  }

  const results = await compiler.build();

  if (!config.watch) {
    if (devServer != null) {
      await devServer.close();
      devServer = null;
    }

    if (results != null && Array.isArray(results.diagnostics)) {
      const hasError = results.diagnostics.some(d => d.level === 'error' || d.type === 'runtime');
      if (hasError) {
        config.sys.destroy();
        exit(1);
      }
    }
  }

  if (config.watch || devServer) {
    process.once('SIGINT', () => {
      config.sys.destroy();

      if (devServer != null) {
        devServer.close();
      }
    });
  }

  if (latestVersionPromise != null) {
    await validateCompilerVersion(config.sys, config.logger, latestVersionPromise);
  }

  return results;
}

function shouldStartDevServer(config: d.Config, flags: d.ConfigFlags) {
  return (config.devServer && (flags.serve || flags.prerender));
}

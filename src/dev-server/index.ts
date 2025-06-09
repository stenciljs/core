import path from 'path';

import type {
  BuildOnEventRemove,
  CompilerBuildResults,
  CompilerWatcher,
  DevServer,
  DevServerConfig,
  DevServerMessage,
  InitServerProcess,
  Logger,
  StencilDevServerConfig,
} from '../declarations';
import { initServerProcessWorkerProxy } from './server-worker-main';

export function start(stencilDevServerConfig: StencilDevServerConfig, logger: Logger, watcher?: CompilerWatcher) {
  return new Promise<DevServer>(async (resolve, reject) => {
    try {
      const devServerConfig: DevServerConfig = {
        devServerDir: __dirname,
        ...stencilDevServerConfig,
      };

      if (!path.isAbsolute(devServerConfig.root)) {
        devServerConfig.root = path.join(process.cwd(), devServerConfig.root);
      }

      let initServerProcess: InitServerProcess;

      if (stencilDevServerConfig.worker === true || stencilDevServerConfig.worker === undefined) {
        // fork a worker process
        initServerProcess = initServerProcessWorkerProxy;
      } else {
        // same process
        const devServerProcess = await import('@dev-server-process');
        initServerProcess = devServerProcess.initServerProcess;
      }

      startServer(devServerConfig, logger, watcher, initServerProcess, resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
}

function startServer(
  devServerConfig: DevServerConfig,
  logger: Logger,
  watcher: CompilerWatcher,
  initServerProcess: InitServerProcess,
  resolve: (devServer: DevServer) => void,
  reject: (err: any) => void,
) {
  const timespan = logger.createTimeSpan(`starting dev server`, true);

  const startupTimeout =
    logger.getLevel() !== 'debug' || devServerConfig.startupTimeout !== 0
      ? setTimeout(() => {
          reject(`dev server startup timeout`);
        }, devServerConfig.startupTimeout ?? 15000)
      : null;

  let isActivelyBuilding = false;
  let lastBuildResults: CompilerBuildResults = null;
  let devServer: DevServer | null = null;
  let removeWatcher: BuildOnEventRemove = null;
  let closeResolve: () => void = null;
  let hasStarted = false;
  let browserUrl = '';

  let sendToWorker: (msg: DevServerMessage) => void = null;

  const closePromise = new Promise<void>((resolve) => (closeResolve = resolve));

  const close = async () => {
    clearTimeout(startupTimeout);
    isActivelyBuilding = false;

    if (removeWatcher) {
      removeWatcher();
    }
    if (devServer) {
      devServer = null;
    }
    if (sendToWorker) {
      sendToWorker({
        closeServer: true,
      });
      sendToWorker = null;
    }
    return closePromise;
  };

  const emit = async (eventName: any, data: any) => {
    if (sendToWorker) {
      if (eventName === 'buildFinish') {
        isActivelyBuilding = false;
        lastBuildResults = { ...data };
        sendToWorker({ buildResults: { ...lastBuildResults }, isActivelyBuilding });
      } else if (eventName === 'buildLog') {
        sendToWorker({
          buildLog: { ...data },
        });
      } else if (eventName === 'buildStart') {
        isActivelyBuilding = true;
      }
    }
  };

  const serverStarted = (msg: DevServerMessage) => {
    hasStarted = true;
    clearTimeout(startupTimeout);
    devServerConfig = msg.serverStarted;

    devServer = {
      address: devServerConfig.address,
      basePath: devServerConfig.basePath,
      browserUrl: devServerConfig.browserUrl,
      protocol: devServerConfig.protocol,
      port: devServerConfig.port,
      root: devServerConfig.root,
      emit,
      close,
    };

    browserUrl = devServerConfig.browserUrl;

    timespan.finish(`dev server started: ${browserUrl}`);

    resolve(devServer);
  };

  const requestLog = (msg: DevServerMessage) => {
    if (devServerConfig.logRequests) {
      if (msg.requestLog.status >= 500) {
        logger.info(logger.red(`${msg.requestLog.method} ${msg.requestLog.url} (${msg.requestLog.status})`));
      } else if (msg.requestLog.status >= 400) {
        logger.info(
          logger.dim(logger.red(`${msg.requestLog.method} ${msg.requestLog.url} (${msg.requestLog.status})`)),
        );
      } else if (msg.requestLog.status >= 300) {
        logger.info(
          logger.dim(logger.magenta(`${msg.requestLog.method} ${msg.requestLog.url} (${msg.requestLog.status})`)),
        );
      } else {
        logger.info(logger.dim(`${logger.cyan(msg.requestLog.method)} ${msg.requestLog.url}`));
      }
    }
  };

  const serverError = async (msg: DevServerMessage) => {
    if (hasStarted) {
      logger.error(msg.error.message + ' ' + msg.error.stack);
    } else {
      await close();
      reject(msg.error.message);
    }
  };

  const requestBuildResults = () => {
    // we received a request to send up the latest build results
    if (sendToWorker) {
      if (lastBuildResults != null) {
        // we do have build results, so let's send them to the child process
        const msg: DevServerMessage = {
          buildResults: { ...lastBuildResults },
          isActivelyBuilding: isActivelyBuilding,
        };

        // but don't send any previous live reload data
        delete msg.buildResults.hmr;
        sendToWorker(msg);
      } else {
        sendToWorker({
          isActivelyBuilding: true,
        });
      }
    }
  };

  const compilerRequest = async (compilerRequestPath: string) => {
    if (watcher && watcher.request && sendToWorker) {
      const compilerRequestResults = await watcher.request({ path: compilerRequestPath });
      sendToWorker({ compilerRequestResults });
    }
  };

  const receiveFromWorker = (msg: DevServerMessage) => {
    try {
      if (msg.serverStarted) {
        serverStarted(msg);
      } else if (msg.serverClosed) {
        logger.debug(`dev server closed: ${browserUrl}`);
        closeResolve();
      } else if (msg.requestBuildResults) {
        requestBuildResults();
      } else if (msg.compilerRequestPath) {
        compilerRequest(msg.compilerRequestPath);
      } else if (msg.requestLog) {
        requestLog(msg);
      } else if (msg.error) {
        serverError(msg);
      } else {
        logger.debug(`server msg not handled: ${JSON.stringify(msg)}`);
      }
    } catch (e) {
      logger.error('receiveFromWorker: ' + e);
    }
  };

  try {
    if (watcher) {
      removeWatcher = watcher.on(emit);
    }

    sendToWorker = initServerProcess(receiveFromWorker);

    sendToWorker({
      startServer: devServerConfig,
    });
  } catch (e) {
    close();
    reject(e);
  }
}

export { DevServer, StencilDevServerConfig as DevServerConfig, Logger };

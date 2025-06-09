import { createNodeSys } from '@sys-api-node';
import { normalizePath } from '@utils';
import type { Server } from 'http';

import type * as d from '../declarations';
import { DEV_SERVER_INIT_URL } from './dev-server-constants';
import { getBrowserUrl } from './dev-server-utils';
import { openInBrowser } from './open-in-browser';
import { BuildRequestResolve, CompilerRequestResolve, createServerContext } from './server-context';
import { createHttpServer, findClosestOpenPort } from './server-http';
import { createWebSocket, DevWebSocket } from './server-web-socket';

export function initServerProcess(sendMsg: d.DevServerSendMessage) {
  let server: Server = null;
  let webSocket: DevWebSocket = null;
  let serverCtx: d.DevServerContext = null;

  const buildResultsResolves: BuildRequestResolve[] = [];
  const compilerRequestResolves: CompilerRequestResolve[] = [];

  const startServer = async (msg: d.DevServerMessage) => {
    const devServerConfig = msg.startServer;
    devServerConfig.port = await findClosestOpenPort(devServerConfig.address, devServerConfig.port);
    devServerConfig.browserUrl = getBrowserUrl(
      devServerConfig.protocol,
      devServerConfig.address,
      devServerConfig.port,
      devServerConfig.basePath,
      '/',
    );
    devServerConfig.root = normalizePath(devServerConfig.root);

    const sys = createNodeSys({ process });
    serverCtx = createServerContext(sys, sendMsg, devServerConfig, buildResultsResolves, compilerRequestResolves);
    server = createHttpServer(devServerConfig, serverCtx);

    webSocket = devServerConfig.websocket ? createWebSocket(server, sendMsg) : null;

    server.listen(devServerConfig.port, devServerConfig.address);
    serverCtx.isServerListening = true;

    if (devServerConfig.openBrowser) {
      const initialLoadUrl = getBrowserUrl(
        devServerConfig.protocol,
        devServerConfig.address,
        devServerConfig.port,
        devServerConfig.basePath,
        devServerConfig.initialLoadUrl || DEV_SERVER_INIT_URL,
      );
      openInBrowser({ url: initialLoadUrl });
    }

    sendMsg({ serverStarted: devServerConfig });
  };

  const closeServer = () => {
    const promises: Promise<any>[] = [];

    buildResultsResolves.forEach((r) => r.reject('dev server closed'));
    buildResultsResolves.length = 0;

    compilerRequestResolves.forEach((r) => r.reject('dev server closed'));
    compilerRequestResolves.length = 0;

    if (serverCtx) {
      if (serverCtx.sys) {
        promises.push(serverCtx.sys.destroy());
      }
    }
    if (webSocket) {
      promises.push(webSocket.close());
      webSocket = null;
    }
    if (server) {
      promises.push(
        new Promise<void>((resolve) => {
          server.close((err) => {
            if (err) {
              console.error(`close error: ${err}`);
            }
            resolve();
          });
        }),
      );
    }
    Promise.all(promises).finally(() => {
      sendMsg({
        serverClosed: true,
      });
    });
  };

  const receiveMessageFromMain = (msg: d.DevServerMessage) => {
    // the server process received a message from main thread
    try {
      if (msg) {
        if (msg.startServer) {
          startServer(msg);
        } else if (msg.closeServer) {
          closeServer();
        } else if (msg.compilerRequestResults) {
          for (let i = compilerRequestResolves.length - 1; i >= 0; i--) {
            const r = compilerRequestResolves[i];
            if (r.path === msg.compilerRequestResults.path) {
              r.resolve(msg.compilerRequestResults);
              compilerRequestResolves.splice(i, 1);
            }
          }
        } else if (serverCtx) {
          if (msg.buildResults && !msg.isActivelyBuilding) {
            buildResultsResolves.forEach((r) => r.resolve(msg.buildResults));
            buildResultsResolves.length = 0;
          }
          if (webSocket) {
            webSocket.sendToBrowser(msg);
          }
        }
      }
    } catch (e) {
      let stack: string | null = null;
      if (e instanceof Error) {
        stack = e.stack;
      }
      sendMsg({
        error: { message: e + '', stack },
      });
    }
  };

  return receiveMessageFromMain;
}

import { noop } from '@utils';
import type { Server } from 'http';
import WebSocket, { type ServerOptions, WebSocketServer } from 'ws';

import type * as d from '../declarations';

export function createWebSocket(
  httpServer: Server,
  onMessageFromClient: (msg: d.DevServerMessage) => void,
): DevWebSocket {
  const wsConfig: ServerOptions = {
    server: httpServer,
  };

  const wsServer = new WebSocketServer(wsConfig);

  function heartbeat(this: WebSocket) {
    // we need to coerce the `ws` type to our custom `DevWS` type here, since
    // this function is going to be passed in to `ws.on('pong'` which expects
    // to be passed a function where `this` is bound to `ws`.
    (this as DevWS).isAlive = true;
  }

  wsServer.on('connection', (ws: DevWS) => {
    ws.on('message', (data) => {
      // the server process has received a message from the browser
      // pass the message received from the browser to the main cli process
      try {
        onMessageFromClient(JSON.parse(data.toString()));
      } catch (e) {
        console.error(e);
      }
    });

    ws.isAlive = true;

    ws.on('pong', heartbeat);

    // ignore invalid close frames sent by Safari 15
    ws.on('error', console.error);
  });

  const pingInterval = setInterval(() => {
    (wsServer.clients as Set<DevWS>).forEach((ws: DevWS) => {
      if (!ws.isAlive) {
        return ws.close(1000);
      }
      ws.isAlive = false;
      ws.ping(noop);
    });
  }, 10000);

  return {
    sendToBrowser: (msg: d.DevServerMessage) => {
      if (msg && wsServer && wsServer.clients) {
        const data = JSON.stringify(msg);
        wsServer.clients.forEach((ws) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(data);
          }
        });
      }
    },
    close: () => {
      return new Promise((resolve, reject) => {
        clearInterval(pingInterval);
        wsServer.clients.forEach((ws) => {
          ws.close(1000);
        });
        wsServer.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
  };
}

export interface DevWebSocket {
  sendToBrowser: (msg: d.DevServerMessage) => void;
  close: () => Promise<void>;
}

interface DevWS extends WebSocket {
  isAlive: boolean;
}

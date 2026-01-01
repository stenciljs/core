import * as http from 'http';
import * as https from 'https';
import * as net from 'net';

import type * as d from '../declarations';
import { createRequestHandler } from './request-handler';

export function createHttpServer(devServerConfig: d.DevServerConfig, serverCtx: d.DevServerContext) {
  // create our request handler
  const reqHandler = createRequestHandler(devServerConfig, serverCtx);

  const credentials = devServerConfig.https;

  return credentials ? https.createServer(credentials, reqHandler) : http.createServer(reqHandler);
}

export async function findClosestOpenPort(host: string, port: number, strictPort = false): Promise<number> {
  const isTaken = await isPortTaken(host, port);

  if (!isTaken) {
    return port;
  }

  if (strictPort) {
    throw new Error(`Port ${port} is already in use. Please specify a different port or set strictPort to false.`);
  }

  // If strictPort is false, recursively find the next available port
  async function t(portToCheck: number): Promise<number> {
    const isTaken = await isPortTaken(host, portToCheck);
    if (!isTaken) {
      return portToCheck;
    }
    return t(portToCheck + 1);
  }

  return t(port + 1);
}

function isPortTaken(host: string, port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once('error', () => {
        resolve(true);
      })
      .once('listening', () => {
        tester
          .once('close', () => {
            resolve(false);
          })
          .close();
      })
      .on('error', (err: any) => {
        reject(err);
      })
      .listen(port, host);
  });
}

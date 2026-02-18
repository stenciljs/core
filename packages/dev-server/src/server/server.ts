/**
 * HTTP and WebSocket server.
 * Consolidated from server-process.ts, server-http.ts, and server-web-socket.ts.
 * Uses native Node 22+ WebSocket instead of the 'ws' package.
 */

import * as http from 'node:http'
import * as https from 'node:https'
import * as net from 'node:net'
import { WebSocketServer, type WebSocket as NodeWebSocket } from 'node:ws'

import type {
  CompilerBuildResults,
  DevServerConfig,
  DevServerContext,
  DevServerMessage,
  DevServerSendMessage,
  DevWebSocket,
} from './types.js'
import {
  createServerContext,
  type BuildRequestResolve,
  type CompilerRequestResolve,
} from './context.js'
import { createRequestHandler } from './handlers.js'
import { getBrowserUrl, normalizePath, DEV_SERVER_INIT_URL } from './utils.js'
import { openInBrowser } from './editor.js'

// =============================================================================
// HTTP Server
// =============================================================================

export function createHttpServer(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext
): http.Server | https.Server {
  const reqHandler = createRequestHandler(devServerConfig, serverCtx)
  const credentials = devServerConfig.https

  return credentials
    ? https.createServer(credentials, reqHandler)
    : http.createServer(reqHandler)
}

// =============================================================================
// Port Detection
// =============================================================================

export async function findClosestOpenPort(
  host: string,
  port: number,
  strictPort = false
): Promise<number> {
  const isTaken = await isPortTaken(host, port)

  if (!isTaken) {
    return port
  }

  if (strictPort) {
    throw new Error(
      `Port ${port} is already in use. Please specify a different port or set strictPort to false.`
    )
  }

  // Recursively find the next available port
  async function findNext(portToCheck: number): Promise<number> {
    const taken = await isPortTaken(host, portToCheck)
    if (!taken) {
      return portToCheck
    }
    return findNext(portToCheck + 1)
  }

  return findNext(port + 1)
}

function isPortTaken(host: string, port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once('error', () => {
        resolve(true)
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close()
      })
      .on('error', (err) => {
        reject(err)
      })
      .listen(port, host)
  })
}

// =============================================================================
// WebSocket Server (Native Node 22+)
// =============================================================================

interface DevWS extends NodeWebSocket {
  isAlive: boolean
}

export function createWebSocket(
  httpServer: http.Server | https.Server,
  onMessageFromClient: (msg: DevServerMessage) => void
): DevWebSocket {
  const wsServer = new WebSocketServer({ server: httpServer })

  function heartbeat(this: DevWS): void {
    this.isAlive = true
  }

  wsServer.on('connection', (ws: DevWS) => {
    ws.on('message', (data) => {
      try {
        onMessageFromClient(JSON.parse(data.toString()))
      } catch (e) {
        console.error('WebSocket message parse error:', e)
      }
    })

    ws.isAlive = true
    ws.on('pong', heartbeat)

    // Handle errors gracefully
    ws.on('error', (err) => {
      console.error('WebSocket error:', err)
    })
  })

  // Heartbeat interval to detect stale connections
  const pingInterval = setInterval(() => {
    wsServer.clients.forEach((ws) => {
      const devWs = ws as DevWS
      if (!devWs.isAlive) {
        return devWs.close(1000)
      }
      devWs.isAlive = false
      devWs.ping()
    })
  }, 10000)

  return {
    sendToBrowser: (msg: DevServerMessage): void => {
      if (msg && wsServer && wsServer.clients) {
        const data = JSON.stringify(msg)
        wsServer.clients.forEach((ws) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(data)
          }
        })
      }
    },
    close: (): Promise<void> => {
      return new Promise((resolve, reject) => {
        clearInterval(pingInterval)
        wsServer.clients.forEach((ws) => {
          ws.close(1000)
        })
        wsServer.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    },
  }
}

// =============================================================================
// Server Process (simplified - no worker forking)
// =============================================================================

export interface ServerProcessOptions {
  sys: {
    destroy(): Promise<void>
    stat(path: string): Promise<{ isFile: boolean; isDirectory: boolean; size: number }>
    readFile(path: string, encoding: string): Promise<string>
    readFileSync(path: string, encoding?: string): string
    readDir(path: string): Promise<string[]>
  }
}

export function initServerProcess(
  sendMsg: DevServerSendMessage,
  createNodeSys: () => ServerProcessOptions['sys']
): (msg: DevServerMessage) => void {
  let server: http.Server | https.Server | null = null
  let webSocket: DevWebSocket | null = null
  let serverCtx: DevServerContext | null = null

  const buildResultsResolves: BuildRequestResolve[] = []
  const compilerRequestResolves: CompilerRequestResolve[] = []

  const startServer = async (msg: DevServerMessage): Promise<void> => {
    const devServerConfig = msg.startServer!

    devServerConfig.port = await findClosestOpenPort(
      devServerConfig.address!,
      devServerConfig.port!,
      devServerConfig.strictPort
    )

    devServerConfig.browserUrl = getBrowserUrl(
      devServerConfig.protocol!,
      devServerConfig.address!,
      devServerConfig.port!,
      devServerConfig.basePath!,
      '/'
    )

    devServerConfig.root = normalizePath(devServerConfig.root!)

    const sys = createNodeSys()
    serverCtx = createServerContext(
      sys as any,
      sendMsg,
      devServerConfig,
      buildResultsResolves,
      compilerRequestResolves
    )

    server = createHttpServer(devServerConfig, serverCtx)

    webSocket = devServerConfig.websocket ? createWebSocket(server, sendMsg) : null

    server.listen(devServerConfig.port, devServerConfig.address)
    serverCtx.isServerListening = true

    if (devServerConfig.openBrowser) {
      const initialLoadUrl = getBrowserUrl(
        devServerConfig.protocol!,
        devServerConfig.address!,
        devServerConfig.port!,
        devServerConfig.basePath!,
        devServerConfig.initialLoadUrl || DEV_SERVER_INIT_URL
      )
      openInBrowser({ url: initialLoadUrl })
    }

    sendMsg({ serverStarted: devServerConfig })
  }

  const closeServer = (): void => {
    const promises: Promise<unknown>[] = []

    buildResultsResolves.forEach((r) => r.reject('dev server closed'))
    buildResultsResolves.length = 0

    compilerRequestResolves.forEach((r) => r.reject('dev server closed'))
    compilerRequestResolves.length = 0

    if (serverCtx?.sys) {
      promises.push(serverCtx.sys.destroy())
    }

    if (webSocket) {
      promises.push(webSocket.close())
      webSocket = null
    }

    if (server) {
      promises.push(
        new Promise<void>((resolve) => {
          server!.close((err) => {
            if (err) {
              console.error(`close error: ${err}`)
            }
            resolve()
          })
        })
      )
    }

    Promise.all(promises).finally(() => {
      sendMsg({ serverClosed: true })
    })
  }

  const receiveMessageFromMain = (msg: DevServerMessage): void => {
    try {
      if (msg) {
        if (msg.startServer) {
          startServer(msg)
        } else if (msg.closeServer) {
          closeServer()
        } else if (msg.compilerRequestResults) {
          for (let i = compilerRequestResolves.length - 1; i >= 0; i--) {
            const r = compilerRequestResolves[i]
            if (r.path === msg.compilerRequestResults.path) {
              r.resolve(msg.compilerRequestResults)
              compilerRequestResolves.splice(i, 1)
            }
          }
        } else if (serverCtx) {
          if (msg.buildResults && !msg.isActivelyBuilding) {
            buildResultsResolves.forEach((r) => r.resolve(msg.buildResults as CompilerBuildResults))
            buildResultsResolves.length = 0
          }
          if (webSocket) {
            webSocket.sendToBrowser(msg)
          }
        }
      }
    } catch (e) {
      let stack: string | null = null
      if (e instanceof Error) {
        stack = e.stack ?? null
      }
      sendMsg({
        error: { message: String(e), stack },
      })
    }
  }

  return receiveMessageFromMain
}

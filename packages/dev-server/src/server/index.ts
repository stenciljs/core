/**
 * @stencil/dev-server
 *
 * A modern development server for Stencil with DOM-based HMR.
 * Designed for lazy-loading component architectures where module graphs
 * are discovered at runtime from the DOM.
 */

import * as path from 'node:path'

import type {
  CompilerBuildResults,
  CompilerWatcher,
  DevServer,
  DevServerConfig,
  DevServerMessage,
  Logger,
  StencilDevServerConfig,
} from './types.js'
import { initServerProcess, type ServerProcessOptions } from './server.js'

// Re-export types for consumers
export type {
  DevServer,
  DevServerConfig,
  StencilDevServerConfig,
  Logger,
  CompilerWatcher,
} from './types.js'

/**
 * Callback to remove the watcher listener.
 */
type BuildOnEventRemove = () => void

/**
 * Start the Stencil development server.
 *
 * @param stencilDevServerConfig - Configuration for the dev server
 * @param logger - Logger instance for output
 * @param watcher - Optional compiler watcher for build events
 * @returns Promise resolving to the DevServer instance
 */
export function start(
  stencilDevServerConfig: StencilDevServerConfig,
  logger: Logger,
  watcher?: CompilerWatcher
): Promise<DevServer> {
  return new Promise(async (resolve, reject) => {
    try {
      const devServerConfig: DevServerConfig = {
        devServerDir: import.meta.dirname,
        ...stencilDevServerConfig,
      }

      if (!path.isAbsolute(devServerConfig.root!)) {
        devServerConfig.root = path.join(process.cwd(), devServerConfig.root!)
      }

      // Create the node system - lazily loaded from @stencil/core
      const createNodeSys = async (): Promise<ServerProcessOptions['sys']> => {
        const { createNodeSys: createSys } = await import('@stencil/core/sys/node')
        return createSys({ process }) as ServerProcessOptions['sys']
      }

      startServer(devServerConfig, logger, watcher, createNodeSys, resolve, reject)
    } catch (e) {
      reject(e)
    }
  })
}

function startServer(
  devServerConfig: DevServerConfig,
  logger: Logger,
  watcher: CompilerWatcher | undefined,
  createNodeSys: () => Promise<ServerProcessOptions['sys']>,
  resolve: (devServer: DevServer) => void,
  reject: (err: unknown) => void
): void {
  const timespan = logger.createTimeSpan('starting dev server', true)

  const startupTimeout =
    logger.getLevel() !== 'debug' || devServerConfig.startupTimeout !== 0
      ? setTimeout(() => {
          reject('dev server startup timeout')
        }, devServerConfig.startupTimeout ?? 15000)
      : null

  let isActivelyBuilding = false
  let lastBuildResults: CompilerBuildResults | null = null
  let devServer: DevServer | null = null
  let removeWatcher: BuildOnEventRemove | null = null
  let closeResolve: (() => void) | null = null
  let hasStarted = false
  let browserUrl = ''

  let sendToServer: ((msg: DevServerMessage) => void) | null = null

  const closePromise = new Promise<void>((res) => {
    closeResolve = res
  })

  const close = async (): Promise<void> => {
    if (startupTimeout) {
      clearTimeout(startupTimeout)
    }
    isActivelyBuilding = false

    if (removeWatcher) {
      removeWatcher()
    }
    if (devServer) {
      devServer = null
    }
    if (sendToServer) {
      sendToServer({ closeServer: true })
      sendToServer = null
    }
    return closePromise
  }

  const emit = (eventName: string, data: any): void => {
    if (sendToServer) {
      if (eventName === 'buildFinish') {
        isActivelyBuilding = false
        lastBuildResults = { ...(data as CompilerBuildResults) }
        sendToServer({ buildResults: { ...lastBuildResults }, isActivelyBuilding })
      } else if (eventName === 'buildLog') {
        sendToServer({ buildLog: { ...data } })
      } else if (eventName === 'buildStart') {
        isActivelyBuilding = true
      }
    }
  }

  const serverStarted = (msg: DevServerMessage): void => {
    hasStarted = true
    if (startupTimeout) {
      clearTimeout(startupTimeout)
    }
    devServerConfig = msg.serverStarted!

    devServer = {
      address: devServerConfig.address!,
      basePath: devServerConfig.basePath!,
      browserUrl: devServerConfig.browserUrl!,
      protocol: devServerConfig.protocol!,
      port: devServerConfig.port!,
      root: devServerConfig.root!,
      emit,
      close,
    }

    browserUrl = devServerConfig.browserUrl!

    timespan.finish(`dev server started: ${browserUrl}`)

    resolve(devServer)
  }

  const requestLog = (msg: DevServerMessage): void => {
    if (devServerConfig.logRequests && msg.requestLog) {
      if (msg.requestLog.status >= 500) {
        logger.info(logger.red(`${msg.requestLog.method} ${msg.requestLog.url} (${msg.requestLog.status})`))
      } else if (msg.requestLog.status >= 400) {
        logger.info(
          logger.dim(logger.red(`${msg.requestLog.method} ${msg.requestLog.url} (${msg.requestLog.status})`))
        )
      } else if (msg.requestLog.status >= 300) {
        logger.info(
          logger.dim(logger.magenta(`${msg.requestLog.method} ${msg.requestLog.url} (${msg.requestLog.status})`))
        )
      } else {
        logger.info(logger.dim(`${logger.cyan(msg.requestLog.method)} ${msg.requestLog.url}`))
      }
    }
  }

  const serverError = async (msg: DevServerMessage): Promise<void> => {
    if (msg.error) {
      if (hasStarted) {
        logger.error(msg.error.message + ' ' + msg.error.stack)
      } else {
        await close()
        reject(msg.error.message)
      }
    }
  }

  const requestBuildResults = (): void => {
    if (sendToServer) {
      if (lastBuildResults != null) {
        const msg: DevServerMessage = {
          buildResults: { ...lastBuildResults },
          isActivelyBuilding,
        }
        // Don't send previous live reload data
        delete msg.buildResults!.hmr
        sendToServer(msg)
      } else {
        sendToServer({ isActivelyBuilding: true })
      }
    }
  }

  const compilerRequest = async (compilerRequestPath: string): Promise<void> => {
    if (watcher?.request && sendToServer) {
      const compilerRequestResults = await watcher.request({ path: compilerRequestPath })
      sendToServer({ compilerRequestResults })
    }
  }

  const receiveFromServer = (msg: DevServerMessage): void => {
    try {
      if (msg.serverStarted) {
        serverStarted(msg)
      } else if (msg.serverClosed) {
        logger.debug(`dev server closed: ${browserUrl}`)
        closeResolve?.()
      } else if (msg.requestBuildResults) {
        requestBuildResults()
      } else if (msg.compilerRequestPath) {
        compilerRequest(msg.compilerRequestPath)
      } else if (msg.requestLog) {
        requestLog(msg)
      } else if (msg.error) {
        serverError(msg)
      } else {
        logger.debug(`server msg not handled: ${JSON.stringify(msg)}`)
      }
    } catch (e) {
      logger.error('receiveFromServer: ' + e)
    }
  }

  try {
    if (watcher) {
      // Cast emit to the generic callback signature that watcher.on accepts
      removeWatcher = watcher.on(emit as (eventName: string, data: any) => void)
    }

    // Initialize server directly (no worker process)
    createNodeSys().then((sys) => {
      sendToServer = initServerProcess(receiveFromServer, () => sys)

      sendToServer({ startServer: devServerConfig })
    })
  } catch (e) {
    close()
    reject(e)
  }
}

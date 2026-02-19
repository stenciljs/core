/**
 * @stencil/dev-server Client
 *
 * Browser-side HMR (Hot Module Replacement) client for Stencil dev server.
 * Handles WebSocket communication, component updates, style updates, and image updates.
 *
 * This module runs in the browser and is injected into pages during development.
 */

import { DEV_SERVER_INIT_URL, OPEN_IN_EDITOR_URL } from './constants.js'
import { emitBuildStatus, onBuildResults } from './events.js'
import { hmrWindow } from './hmr.js'
import { logBuild, logDiagnostic, logReload, logWarn } from './logger.js'
import { initBuildProgress, initBuildStatus } from './status.js'
import type {
  CompilerBuildResults,
  DevClientConfig,
  DevClientWindow,
  Diagnostic,
  HotModuleReplacement,
  OpenInEditorData,
} from './types.js'
import { initClientWebSocket } from './websocket.js'

// Re-export everything for external use
export * from './constants.js'
export * from './events.js'
export * from './hmr.js'
export * from './logger.js'
export * from './status.js'
export * from './types.js'
export { initClientWebSocket } from './websocket.js'

// =============================================================================
// Error Modal (simplified)
// =============================================================================

interface AppErrorResult {
  diagnostics: Diagnostic[]
  status: string
}

export const appError = (data: {
  window: Window
  buildResults: CompilerBuildResults
  openInEditor: ((data: OpenInEditorData) => void) | null
}): AppErrorResult => {
  const diagnostics = data.buildResults.diagnostics || []
  return {
    diagnostics,
    status: diagnostics.some((d) => d.level === 'error') ? 'error' : 'default',
  }
}

export const clearAppErrorModal = (_data: { window: Window }): void => {
  // Clear error modal if present
}

// =============================================================================
// App Update Handler
// =============================================================================

const initAppUpdate = (win: DevClientWindow, config: DevClientConfig): void => {
  onBuildResults(win, (buildResults) => {
    appUpdate(win, config, buildResults)
  })
}

const appUpdate = (
  win: DevClientWindow,
  config: DevClientConfig,
  buildResults: CompilerBuildResults
): void => {
  try {
    if (buildResults.buildId === win['s-build-id']) {
      return
    }
    win['s-build-id'] = buildResults.buildId

    clearAppErrorModal({ window: win })

    if (buildResults.hasError) {
      const editorId = Array.isArray(config.editors) && config.editors.length > 0 ? config.editors[0].id : null
      const errorResults = appError({
        window: win,
        buildResults,
        openInEditor: editorId
          ? (data) => {
              const qs: OpenInEditorData = {
                file: data.file,
                line: data.line,
                column: data.column,
                editor: editorId,
              }
              const url = `${OPEN_IN_EDITOR_URL}?${Object.keys(qs)
                .map((k) => `${k}=${(qs as Record<string, unknown>)[k]}`)
                .join('&')}`
              win.fetch(url)
            }
          : null,
      })

      errorResults.diagnostics.forEach(logDiagnostic)
      emitBuildStatus(win, errorResults.status)
      return
    }

    if (win['s-initial-load']) {
      appReset(win, config, () => {
        logReload('Initial load')
        win.location.reload()
      })
      return
    }

    if (buildResults.hmr) {
      appHmr(win, buildResults.hmr)
    }
  } catch (e) {
    console.error(e)
  }
}

const appHmr = (win: Window, hmr: HotModuleReplacement): void => {
  let shouldWindowReload = false

  if (hmr.reloadStrategy === 'pageReload') {
    shouldWindowReload = true
  }

  if (hmr.indexHtmlUpdated) {
    logReload('Updated index.html')
    shouldWindowReload = true
  }

  if (hmr.serviceWorkerUpdated) {
    logReload('Updated Service Worker: sw.js')
    shouldWindowReload = true
  }

  if (hmr.scriptsAdded && hmr.scriptsAdded.length > 0) {
    logReload(`Added scripts: ${hmr.scriptsAdded.join(', ')}`)
    shouldWindowReload = true
  }

  if (hmr.scriptsDeleted && hmr.scriptsDeleted.length > 0) {
    logReload(`Deleted scripts: ${hmr.scriptsDeleted.join(', ')}`)
    shouldWindowReload = true
  }

  if (hmr.excludeHmr && hmr.excludeHmr.length > 0) {
    logReload(`Excluded From Hmr: ${hmr.excludeHmr.join(', ')}`)
    shouldWindowReload = true
  }

  if (shouldWindowReload) {
    win.location.reload()
    return
  }

  const results = hmrWindow({ window: win, hmr })

  if (results.updatedComponents.length > 0) {
    logBuild(
      `Updated component${results.updatedComponents.length > 1 ? 's' : ''}: ${results.updatedComponents.join(', ')}`
    )
  }

  if (results.updatedInlineStyles.length > 0) {
    logBuild(`Updated styles: ${results.updatedInlineStyles.join(', ')}`)
  }

  if (results.updatedExternalStyles.length > 0) {
    logBuild(`Updated stylesheets: ${results.updatedExternalStyles.join(', ')}`)
  }

  if (results.updatedImages.length > 0) {
    logBuild(`Updated images: ${results.updatedImages.join(', ')}`)
  }
}

const appReset = (win: DevClientWindow, config: DevClientConfig, cb: () => void): void => {
  win.history.replaceState({}, 'App', config.basePath)

  if (!win.navigator.serviceWorker?.getRegistration) {
    cb()
  } else {
    win.navigator.serviceWorker
      .getRegistration()
      .then((swRegistration) => {
        if (swRegistration) {
          swRegistration.unregister().then((hasUnregistered) => {
            if (hasUnregistered) {
              logBuild('unregistered service worker')
            }
            cb()
          })
        } else {
          cb()
        }
      })
      .catch((err) => {
        logWarn('Service Worker', err)
        cb()
      })
  }
}

// =============================================================================
// Initialize Dev Client
// =============================================================================

export const initDevClient = (win: DevClientWindow, config: DevClientConfig): void => {
  try {
    if (win['s-dev-server']) {
      return
    }
    win['s-dev-server'] = true

    initBuildStatus({ window: win })
    initBuildProgress({ window: win })
    initAppUpdate(win, config)

    if (isInitialDevServerLoad(win, config)) {
      win['s-initial-load'] = true
      appReset(win, config, () => {
        initClientWebSocket(win, config)
      })
    } else {
      initClientWebSocket(win, config)
    }
  } catch (e) {
    console.error(e)
  }
}

const isInitialDevServerLoad = (win: DevClientWindow, config: DevClientConfig): boolean => {
  let pathname = win.location.pathname
  pathname = '/' + pathname.substring(config.basePath.length)
  return pathname === DEV_SERVER_INIT_URL
}

// =============================================================================
// Auto-initialize
// =============================================================================

declare const appWindow: DevClientWindow | undefined
declare const config: DevClientConfig | undefined

if (typeof appWindow !== 'undefined' && typeof config !== 'undefined') {
  const defaultConfig: DevClientConfig = {
    basePath: appWindow.location.pathname,
    editors: [],
    reloadStrategy: 'hmr',
    socketUrl: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.hostname}${
      location.port !== '' ? ':' + location.port : ''
    }/`,
  }

  initDevClient(appWindow, { ...defaultConfig, ...appWindow.devServerConfig, ...config })
}

/**
 * WebSocket client for dev server communication.
 */

import {
  NORMAL_CLOSURE_CODE,
  RECONNECT_ATTEMPTS,
  RECONNECT_RETRY_MS,
  REQUEST_BUILD_RESULTS_INTERVAL_MS,
} from './constants.js'
import { emitBuildLog, emitBuildResults, emitBuildStatus } from './events.js'
import { logDisabled, logReload, logWarn } from './logger.js'
import type { DevClientConfig, DevClientWindow, DevServerMessage } from './types.js'

export const initClientWebSocket = (win: DevClientWindow, config: DevClientConfig): void => {
  let clientWs: WebSocket | null = null
  let reconnectTmrId: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  let requestBuildResultsTmrId: ReturnType<typeof setInterval> | null = null
  let hasGottenBuildResults = false
  let buildResultsRequests = 0

  function onOpen(this: WebSocket): void {
    if (reconnectAttempts > 0) {
      emitBuildStatus(win, 'pending')
    }

    if (!hasGottenBuildResults) {
      requestBuildResultsTmrId = setInterval(() => {
        buildResultsRequests++
        if (!hasGottenBuildResults && this.readyState === WebSocket.OPEN && buildResultsRequests < 500) {
          const msg: DevServerMessage = { requestBuildResults: true }
          this.send(JSON.stringify(msg))
        } else if (requestBuildResultsTmrId) {
          clearInterval(requestBuildResultsTmrId)
        }
      }, REQUEST_BUILD_RESULTS_INTERVAL_MS)
    }

    if (reconnectTmrId) {
      clearTimeout(reconnectTmrId)
    }
  }

  function onError(): void {
    queueReconnect()
  }

  function onClose(event: CloseEvent): void {
    emitBuildStatus(win, 'disabled')

    if (event.code > NORMAL_CLOSURE_CODE) {
      logWarn('Dev Server', `web socket closed: ${event.code} ${event.reason}`)
    } else {
      logDisabled('Dev Server', 'Disconnected, attempting to reconnect...')
    }

    queueReconnect()
  }

  function onMessage(event: MessageEvent): void {
    const msg: DevServerMessage = JSON.parse(event.data)

    if (reconnectAttempts > 0) {
      if (msg.isActivelyBuilding) {
        return
      }

      if (msg.buildResults) {
        logReload('Reconnected to dev server')
        hasGottenBuildResults = true
        buildResultsRequests = 0
        if (requestBuildResultsTmrId) {
          clearInterval(requestBuildResultsTmrId)
        }

        if (win['s-build-id'] !== msg.buildResults.buildId) {
          win.location.reload()
        }
        win['s-build-id'] = msg.buildResults.buildId
        return
      }
    }

    if (msg.buildLog) {
      if (msg.buildLog.progress < 1) {
        emitBuildStatus(win, 'pending')
      }
      emitBuildLog(win, msg.buildLog)
      return
    }

    if (msg.buildResults) {
      hasGottenBuildResults = true
      buildResultsRequests = 0
      if (requestBuildResultsTmrId) {
        clearInterval(requestBuildResultsTmrId)
      }
      emitBuildStatus(win, 'default')
      emitBuildResults(win, msg.buildResults)
    }
  }

  function connect(): void {
    if (reconnectTmrId) {
      clearTimeout(reconnectTmrId)
    }

    clientWs = new win.WebSocket(config.socketUrl!, ['xmpp'])

    clientWs.addEventListener('open', onOpen)
    clientWs.addEventListener('error', onError)
    clientWs.addEventListener('close', onClose)
    clientWs.addEventListener('message', onMessage)
  }

  function queueReconnect(): void {
    hasGottenBuildResults = false

    if (clientWs) {
      if (clientWs.readyState === WebSocket.OPEN || clientWs.readyState === WebSocket.CONNECTING) {
        clientWs.close(NORMAL_CLOSURE_CODE)
      }

      clientWs.removeEventListener('open', onOpen)
      clientWs.removeEventListener('error', onError)
      clientWs.removeEventListener('close', onClose)
      clientWs.removeEventListener('message', onMessage)
      clientWs = null
    }

    if (reconnectTmrId) {
      clearTimeout(reconnectTmrId)
    }

    if (reconnectAttempts >= RECONNECT_ATTEMPTS) {
      logWarn('Dev Server', 'Canceling reconnect attempts')
    } else {
      reconnectAttempts++
      reconnectTmrId = setTimeout(connect, RECONNECT_RETRY_MS)
      emitBuildStatus(win, 'disabled')
    }
  }

  connect()
}

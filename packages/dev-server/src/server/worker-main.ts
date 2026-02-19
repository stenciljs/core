/**
 * Worker process proxy for dev server.
 * Forks a child process to run the HTTP and WebSocket server in isolation.
 */

import { fork, type ChildProcess } from 'node:child_process'
import * as path from 'node:path'

import type { DevServerMessage } from './types'

/**
 * Initialize the dev server in a forked worker process.
 * This provides process isolation so that server crashes don't affect the main compiler.
 *
 * @param sendToMain - Callback to send messages from worker to main process
 * @returns Function to send messages from main to worker process
 */
export function initServerProcessWorkerProxy(
  sendToMain: (msg: DevServerMessage) => void
): (msg: DevServerMessage) => void {
  // Resolve the worker thread entry point
  const workerPath = path.join(import.meta.dirname, 'worker-thread.js')

  // Filter out debug/inspect args to avoid port conflicts
  const filteredExecArgs = process.execArgv.filter((v) => !/^--(debug|inspect)/.test(v))

  const forkOpts = {
    execArgv: filteredExecArgs,
    env: process.env,
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'] as ['pipe', 'pipe', 'pipe', 'ipc'],
  }

  // Start a new child process for the HTTP and WebSocket server
  let serverProcess: ChildProcess | null = fork(workerPath, [], forkOpts)

  /**
   * Send a message from main to the worker process
   */
  const receiveFromMain = (msg: DevServerMessage): void => {
    if (serverProcess && serverProcess.connected) {
      serverProcess.send(msg)
    } else if (msg.closeServer) {
      sendToMain({ serverClosed: true })
    }
  }

  // Get messages from the worker and send them to main
  serverProcess.on('message', (msg: DevServerMessage) => {
    if (msg.serverClosed && serverProcess) {
      serverProcess.kill('SIGINT')
      serverProcess = null
    }
    sendToMain(msg)
  })

  // Forward stdout from worker to console
  serverProcess.stdout?.on('data', (data: Buffer) => {
    console.log(`dev server: ${data}`)
  })

  // Forward stderr from worker to main as error message
  serverProcess.stderr?.on('data', (data: Buffer) => {
    sendToMain({ error: { message: 'stderr: ' + data.toString(), type: 'stderr', stack: null } })
  })

  // Handle worker process errors
  serverProcess.on('error', (error) => {
    sendToMain({
      error: {
        message: error.message,
        type: 'worker-error',
        stack: error.stack || null,
      },
    })
  })

  // Handle worker process exit
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      sendToMain({
        error: {
          message: `Worker process exited with code ${code}`,
          type: 'worker-exit',
          stack: null,
        },
      })
    }
    if (serverProcess) {
      serverProcess = null
      sendToMain({ serverClosed: true })
    }
  })

  return receiveFromMain
}

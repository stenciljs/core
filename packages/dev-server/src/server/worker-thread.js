/**
 * Worker thread entry point for dev server.
 * This file is the main entry for the forked child process that runs the HTTP/WebSocket server.
 * It communicates with the parent process via IPC messages.
 */

import { initServerProcess } from './index.mjs'

let closeTmr = null

/**
 * Handle errors when sending messages to parent process
 */
const sendHandle = (err) => {
  if (err && err.code === 'ERR_IPC_CHANNEL_CLOSED') {
    // Parent process closed the IPC channel, exit cleanly
    process.exit(0)
  }
}

/**
 * Initialize the server process and set up message passing
 */
const receiveMessageFromMain = initServerProcess((msg) => {
  // Send message from worker going to main
  process.send(msg, sendHandle)

  if (msg.serverClosed) {
    clearTimeout(closeTmr)
    process.exit(0)
  }
})

/**
 * Receive messages from the main process
 */
process.on('message', (msg) => {
  if (msg && msg.closeServer) {
    // Set a timeout to force exit if graceful shutdown takes too long
    closeTmr = setTimeout(() => {
      process.exit(0)
    }, 5000)
  }

  receiveMessageFromMain(msg)
})

/**
 * Handle uncaught promise rejections and report to main process
 */
process.on('unhandledRejection', (e) => {
  process.send(
    {
      error: {
        message: 'unhandledRejection: ' + e,
        stack: typeof e.stack === 'string' ? e.stack : null,
      },
    },
    sendHandle
  )
})

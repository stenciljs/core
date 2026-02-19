/**
 * Client-side logging utilities for dev server.
 */

import type { Diagnostic } from './types'

const YELLOW = '#f39c12'
const RED = '#c0392b'
const BLUE = '#3498db'
const GRAY = '#717171'

const log = (color: string, prefix: string, msg: string): void => {
  console.log(
    '%c' + prefix,
    `background: ${color}; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;`,
    msg
  )
}

export const logBuild = (msg: string): void => log(BLUE, 'Build', msg)
export const logReload = (msg: string): void => logWarn('Reload', msg)
export const logWarn = (prefix: string, msg: string): void => log(YELLOW, prefix, msg)
export const logDisabled = (prefix: string, msg: string): void => log(GRAY, prefix, msg)

export const logDiagnostic = (diag: Diagnostic): void => {
  let color = RED
  let prefix = 'Error'

  if (diag.level === 'warn') {
    color = YELLOW
    prefix = 'Warning'
  }

  if (diag.header) {
    prefix = diag.header
  }

  let msg = ''

  if (diag.relFilePath) {
    msg += diag.relFilePath

    if (typeof diag.lineNumber === 'number' && diag.lineNumber > 0) {
      msg += ', line ' + diag.lineNumber

      if (typeof diag.columnNumber === 'number' && diag.columnNumber > 0) {
        msg += ', column ' + diag.columnNumber
      }
    }
    msg += '\n'
  }

  msg += diag.messageText

  log(color, prefix, msg)
}

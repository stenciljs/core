/**
 * Client-side event system for dev server.
 */

import { BUILD_LOG, BUILD_RESULTS, BUILD_STATUS } from './constants.js'
import type { BuildLog, CompilerBuildResults } from './types.js'

export const emitBuildLog = (win: Window, buildLog: BuildLog): void => {
  win.dispatchEvent(new CustomEvent(BUILD_LOG, { detail: buildLog }))
}

export const emitBuildResults = (win: Window, buildResults: CompilerBuildResults): void => {
  win.dispatchEvent(new CustomEvent(BUILD_RESULTS, { detail: buildResults }))
}

export const emitBuildStatus = (win: Window, buildStatus: string): void => {
  win.dispatchEvent(new CustomEvent(BUILD_STATUS, { detail: buildStatus }))
}

export const onBuildLog = (win: Window, cb: (buildLog: BuildLog) => void): void => {
  win.addEventListener(BUILD_LOG, ((ev: CustomEvent<BuildLog>) => {
    cb(ev.detail)
  }) as EventListener)
}

export const onBuildResults = (win: Window, cb: (buildResults: CompilerBuildResults) => void): void => {
  win.addEventListener(BUILD_RESULTS, ((ev: CustomEvent<CompilerBuildResults>) => {
    cb(ev.detail)
  }) as EventListener)
}

export const onBuildStatus = (win: Window, cb: (buildStatus: string) => void): void => {
  win.addEventListener(BUILD_STATUS, ((ev: CustomEvent<string>) => {
    cb(ev.detail)
  }) as EventListener)
}

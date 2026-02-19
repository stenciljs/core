/**
 * Client-side type definitions for dev server.
 */

// Import and re-export compiler types from @stencil/core
import type {
  CompilerBuildResults,
  Diagnostic,
  HotModuleReplacement,
  HmrStyleUpdate,
  PrintLine,
} from '@stencil/core/compiler'

export type {
  CompilerBuildResults,
  Diagnostic,
  HotModuleReplacement,
  HmrStyleUpdate,
  PrintLine,
}

export interface DevClientWindow extends Window {
  's-dev-server'?: boolean
  's-initial-load'?: boolean
  's-build-id'?: number
  devServerConfig?: DevClientConfig
  WebSocket: typeof WebSocket
}

export interface DevClientConfig {
  basePath: string
  editors: DevServerEditor[]
  reloadStrategy: 'hmr' | 'pageReload' | null
  socketUrl?: string
}

export interface DevServerEditor {
  id: string
  name?: string
}

export interface DevServerMessage {
  buildResults?: CompilerBuildResults
  buildLog?: BuildLog
  isActivelyBuilding?: boolean
  requestBuildResults?: boolean
}

export interface BuildLog {
  buildId: number
  messages: string[]
  progress: number
}

export interface HostElement extends Element {
  's-hmr'?: (versionId: string) => void
}

export interface OpenInEditorData {
  file?: string
  line?: number
  column?: number
  editor?: string
}

export interface HmrResults {
  updatedComponents: string[]
  updatedExternalStyles: string[]
  updatedInlineStyles: string[]
  updatedImages: string[]
  versionId: string
}

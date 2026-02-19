/**
 * Client-side type definitions for dev server.
 */

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

export interface CompilerBuildResults {
  buildId: number
  hasError: boolean
  diagnostics: Diagnostic[]
  hmr?: HotModuleReplacement
  hydrateAppFilePath?: string
  hasSuccessfulBuild?: boolean
}

export interface Diagnostic {
  level: 'error' | 'warn' | 'info' | 'log' | 'debug'
  type: string
  messageText: string
  header?: string
  relFilePath?: string
  lineNumber?: number
  columnNumber?: number
  lines: unknown[]
}

export interface HotModuleReplacement {
  versionId: string
  componentsUpdated?: string[]
  inlineStylesUpdated?: HmrStyleUpdate[]
  externalStylesUpdated?: string[]
  imagesUpdated?: string[]
  reloadStrategy?: 'hmr' | 'pageReload'
  indexHtmlUpdated?: boolean
  serviceWorkerUpdated?: boolean
  scriptsAdded?: string[]
  scriptsDeleted?: string[]
  excludeHmr?: string[]
}

export interface HmrStyleUpdate {
  styleId: string
  styleTag: string
  styleText: string
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

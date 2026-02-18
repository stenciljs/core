/**
 * Types for the Stencil Dev Server.
 * Re-exports relevant types from @stencil/core and defines local interfaces.
 */

import type { ServerResponse, IncomingMessage } from 'node:http'

// Re-export types from core that we need
export type {
  CompilerBuildResults,
  CompilerFsStats,
  CompilerRequestResponse,
  CompilerSystem,
  CompilerWatcher,
  DevServer,
  DevServerConfig,
  DevServerEditor,
  Diagnostic,
  Logger,
  PageReloadStrategy,
  PrerenderConfig,
  PrerenderHydrateOptions,
  SerializeDocumentOptions,
  HydrateResults,
  StencilDevServerConfig,
} from '@stencil/core/compiler'

/**
 * Internal dev server message protocol for communication between
 * main process and browser clients.
 */
export interface DevServerMessage {
  startServer?: DevServerConfig
  closeServer?: boolean
  serverStarted?: DevServerConfig
  serverClosed?: boolean
  buildStart?: boolean
  buildLog?: BuildLog
  buildResults?: CompilerBuildResults
  requestBuildResults?: boolean
  error?: { message?: string; type?: string; stack?: string | null }
  isActivelyBuilding?: boolean
  compilerRequestPath?: string
  compilerRequestResults?: CompilerRequestResponse
  requestLog?: {
    method: string
    url: string
    status: number
  }
}

export interface BuildLog {
  buildId: number
  messages: string[]
  progress: number
}

export type DevServerSendMessage = (msg: DevServerMessage) => void

/**
 * Server context passed to request handlers.
 */
export interface DevServerContext {
  connectorHtml: string | null
  dirTemplate: string | null
  getBuildResults: () => Promise<CompilerBuildResults>
  getCompilerRequest: (path: string) => Promise<CompilerRequestResponse>
  isServerListening: boolean
  logRequest: (req: HttpRequest, status: number) => void
  prerenderConfig: PrerenderConfig | null
  serve302: (req: HttpRequest, res: ServerResponse, pathname?: string) => void
  serve404: (req: HttpRequest, res: ServerResponse, xSource: string, content?: string) => void
  serve500: (req: HttpRequest, res: ServerResponse, error: unknown, xSource: string) => void
  sys: CompilerSystem
}

/**
 * Normalized HTTP request object.
 */
export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS'
  acceptHeader: string
  url: URL | null
  searchParams: URLSearchParams | null
  pathname?: string
  filePath?: string
  stats?: CompilerFsStats
  headers?: Record<string, string>
  host?: string
}

/**
 * Response headers for dev server responses.
 */
export interface DevResponseHeaders {
  'cache-control'?: string
  expires?: string
  'content-type'?: string
  'content-length'?: number
  date?: string
  'access-control-allow-origin'?: string
  'access-control-expose-headers'?: string
  'content-encoding'?: 'gzip'
  vary?: 'Accept-Encoding'
  server?: string
  'x-directory-index'?: string
  'x-source'?: string
}

/**
 * Open in editor request data.
 */
export interface OpenInEditorData {
  file?: string
  line?: number
  column?: number
  editor?: string
  exists?: boolean
  open?: string
  error?: string
}

/**
 * Dev client configuration sent to the browser.
 */
export interface DevClientConfig {
  basePath: string
  editors: DevServerEditor[]
  reloadStrategy: PageReloadStrategy
  socketUrl?: string
}

/**
 * WebSocket server interface for browser communication.
 */
export interface DevWebSocket {
  sendToBrowser: (msg: DevServerMessage) => void
  close: () => Promise<void>
}

// Import core types
import type {
  CompilerBuildResults,
  CompilerRequestResponse,
  DevServerConfig,
  DevServerEditor,
  PrerenderConfig,
  CompilerFsStats,
  CompilerSystem,
  PageReloadStrategy,
} from '@stencil/core/compiler'

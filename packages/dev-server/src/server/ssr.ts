/**
 * SSR (Server-Side Rendering) request handling.
 * Migrated from ssr-request.ts.
 */

import * as path from 'node:path'
import type { ServerResponse } from 'node:http'

import type {
  DevServerConfig,
  DevServerContext,
  Diagnostic,
  HttpRequest,
  PrerenderHydrateOptions,
  HydrateResults,
} from './types.js'
import { getSsrStaticDataPath, responseHeaders } from './utils.js'
import { appendDevServerClientScript } from './handlers.js'

// =============================================================================
// Types
// =============================================================================

interface HydrateApp {
  renderToString: (
    html: string,
    options: PrerenderHydrateOptions
  ) => Promise<HydrateResults>
}

interface SetupResult {
  hydrateApp: HydrateApp | null
  srcIndexHtml: string | null
  diagnostics: Diagnostic[]
}

// =============================================================================
// SSR Page Request
// =============================================================================

export async function ssrPageRequest(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext,
  req: HttpRequest,
  res: ServerResponse
): Promise<void> {
  try {
    let status = 500
    let content = ''

    const { hydrateApp, srcIndexHtml, diagnostics } = await setupHydrateApp(
      devServerConfig,
      serverCtx
    )

    if (!diagnostics.some((diagnostic) => diagnostic.level === 'error')) {
      try {
        const opts = getSsrHydrateOptions(devServerConfig, serverCtx, req.url!)

        const ssrResults = await hydrateApp!.renderToString(srcIndexHtml!, opts)

        diagnostics.push(...ssrResults.diagnostics)
        status = ssrResults.httpStatus
        content = ssrResults.html
      } catch (e) {
        catchError(diagnostics, e)
      }
    }

    if (diagnostics.some((diagnostic) => diagnostic.level === 'error')) {
      content = getSsrErrorContent(diagnostics)
      status = 500
    }

    if (devServerConfig.websocket) {
      content = appendDevServerClientScript(devServerConfig, req, content)
    }

    serverCtx.logRequest(req, status)

    res.writeHead(
      status,
      responseHeaders({
        'content-type': 'text/html; charset=utf-8',
        'content-length': Buffer.byteLength(content, 'utf8'),
      })
    )
    res.write(content)
    res.end()
  } catch (e) {
    serverCtx.serve500(req, res, e, 'ssrPageRequest')
  }
}

// =============================================================================
// SSR Static Data Request
// =============================================================================

export async function ssrStaticDataRequest(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext,
  req: HttpRequest,
  res: ServerResponse
): Promise<void> {
  try {
    const data: Record<string, unknown> = {}
    let httpCache = false

    const { hydrateApp, srcIndexHtml, diagnostics } = await setupHydrateApp(
      devServerConfig,
      serverCtx
    )

    if (!diagnostics.some((diagnostic) => diagnostic.level === 'error')) {
      try {
        const { ssrPath, hasQueryString } = getSsrStaticDataPath(req)
        const url = new URL(ssrPath, req.url!)

        const opts = getSsrHydrateOptions(devServerConfig, serverCtx, url)

        const ssrResults = await hydrateApp!.renderToString(srcIndexHtml!, opts)

        diagnostics.push(...ssrResults.diagnostics)

        ssrResults.staticData.forEach((s: { type: string; id: string; content: string }) => {
          if (s.type === 'application/json') {
            data[s.id] = JSON.parse(s.content)
          } else {
            data[s.id] = s.content
          }
        })
        data.components = ssrResults.components.map((c: { tag: string }) => c.tag).sort()
        httpCache = hasQueryString
      } catch (e) {
        catchError(diagnostics, e)
      }
    }

    if (diagnostics.length > 0) {
      data.diagnostics = diagnostics
    }

    const status = diagnostics.some((diagnostic) => diagnostic.level === 'error') ? 500 : 200
    const content = JSON.stringify(data)
    serverCtx.logRequest(req, status)

    res.writeHead(
      status,
      responseHeaders(
        {
          'content-type': 'application/json; charset=utf-8',
          'content-length': Buffer.byteLength(content, 'utf8'),
        },
        httpCache && status === 200
      )
    )
    res.write(content)
    res.end()
  } catch (e) {
    serverCtx.serve500(req, res, e, 'ssrStaticDataRequest')
  }
}

// =============================================================================
// Hydrate App Setup
// =============================================================================

async function setupHydrateApp(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext
): Promise<SetupResult> {
  let srcIndexHtml: string | null = null
  let hydrateApp: HydrateApp | null = null

  const buildResults = await serverCtx.getBuildResults()
  const diagnostics: Diagnostic[] = []

  if (serverCtx.prerenderConfig == null && isString(devServerConfig.prerenderConfig)) {
    const compilerPath = path.join(devServerConfig.devServerDir!, '..', 'compiler', 'stencil.js')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const compiler: typeof import('@stencil/core/compiler') = require(compilerPath)
    const prerenderConfigResults = compiler.nodeRequire(devServerConfig.prerenderConfig)
    diagnostics.push(...prerenderConfigResults.diagnostics)
    if (prerenderConfigResults.module?.config) {
      serverCtx.prerenderConfig = prerenderConfigResults.module.config
    }
  }

  if (!isString(buildResults.hydrateAppFilePath)) {
    diagnostics.push({
      messageText: 'Missing hydrateAppFilePath',
      level: 'error',
      type: 'ssr',
      lines: [],
    })
  } else if (!isString(devServerConfig.srcIndexHtml)) {
    diagnostics.push({
      messageText: 'Missing srcIndexHtml',
      level: 'error',
      type: 'ssr',
      lines: [],
    })
  } else {
    srcIndexHtml = await serverCtx.sys.readFile(devServerConfig.srcIndexHtml, 'utf8')
    if (!isString(srcIndexHtml)) {
      diagnostics.push({
        level: 'error',
        lines: [],
        messageText: `Unable to load src index html: ${devServerConfig.srcIndexHtml}`,
        type: 'ssr',
      })
    } else {
      const hydrateAppFilePath = path.resolve(buildResults.hydrateAppFilePath)

      // Clear require cache for hydrate app (brute force)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require.cache = {}
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Module = require('module')
      Module._cache[hydrateAppFilePath] = undefined

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      hydrateApp = require(hydrateAppFilePath)
    }
  }

  return {
    hydrateApp,
    srcIndexHtml,
    diagnostics,
  }
}

// =============================================================================
// SSR Hydrate Options
// =============================================================================

function getSsrHydrateOptions(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext,
  url: URL
): PrerenderHydrateOptions {
  const opts: PrerenderHydrateOptions = {
    url: url.href,
    addModulePreloads: false,
    approximateLineWidth: 120,
    inlineExternalStyleSheets: false,
    minifyScriptElements: false,
    minifyStyleElements: false,
    removeAttributeQuotes: false,
    removeBooleanAttributeQuotes: false,
    removeEmptyAttributes: false,
    removeHtmlComments: false,
    prettyHtml: true,
  }

  const prerenderConfig = serverCtx?.prerenderConfig

  if (isFunction(prerenderConfig?.hydrateOptions)) {
    const userOpts = prerenderConfig.hydrateOptions(url)
    if (userOpts) {
      Object.assign(opts, userOpts)
    }
  }

  if (isFunction(serverCtx.sys.applyPrerenderGlobalPatch)) {
    const orgBeforeHydrate = opts.beforeHydrate
    opts.beforeHydrate = (document: Document) => {
      const devServerBaseUrl = new URL(devServerConfig.browserUrl!)
      const devServerHostUrl = devServerBaseUrl.origin
      serverCtx.sys.applyPrerenderGlobalPatch({
        devServerHostUrl,
        window: document.defaultView,
      })

      if (typeof orgBeforeHydrate === 'function') {
        return orgBeforeHydrate(document)
      }
    }
  }

  return opts
}

// =============================================================================
// Error Handling
// =============================================================================

function getSsrErrorContent(diagnostics: Diagnostic[]): string {
  return `<!doctype html>
<html>
<head>
  <title>SSR Error</title>
  <style>
    body {
      font-family: Consolas, 'Liberation Mono', Menlo, Courier, monospace !important;
    }
  </style>
</head>
<body>
  <h1>SSR Dev Error</h1>
  ${diagnostics
    .map(
      (diagnostic) => `
  <p>
    ${diagnostic.messageText}
  </p>
  `
    )
    .join('')}
</body>
</html>`
}

function catchError(diagnostics: Diagnostic[], err: unknown): void {
  const diagnostic: Diagnostic = {
    level: 'error',
    type: 'runtime',
    messageText: '',
    lines: [],
  }

  if (err instanceof Error) {
    diagnostic.messageText = err.message
    if (err.stack) {
      diagnostic.messageText += '\n' + err.stack
    }
  } else {
    diagnostic.messageText = String(err)
  }

  diagnostics.push(diagnostic)
}

// =============================================================================
// Utility Functions
// =============================================================================

function isString(val: unknown): val is string {
  return typeof val === 'string'
}

function isFunction(val: unknown): val is Function {
  return typeof val === 'function'
}

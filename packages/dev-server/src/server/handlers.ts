/**
 * Request handlers.
 * Consolidated from request-handler.ts, serve-file.ts, serve-dev-client.ts,
 * serve-dev-node-module.ts, and serve-directory-index.ts.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as zlib from 'node:zlib'
import type { IncomingMessage, ServerResponse } from 'node:http'

import type {
  DevServerConfig,
  DevServerContext,
  DevClientConfig,
  HttpRequest,
} from './types'
import {
  DEV_SERVER_URL,
  VERSION,
  getContentType,
  getDevServerClientUrl,
  isDevClient,
  isDevModule,
  isDevServerClient,
  isExtensionLessPath,
  isHtmlFile,
  isCssFile,
  isInitialDevServerLoad,
  isOpenInEditor,
  isSimpleText,
  isSsrStaticDataPath,
  normalizePath,
  responseHeaders,
  shouldCompress,
} from './utils'
import { getEditors, serveOpenInEditor } from './editor'
import { ssrPageRequest, ssrStaticDataRequest } from './ssr'

// =============================================================================
// Main Request Handler
// =============================================================================

export function createRequestHandler(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  let userRequestHandler: ((req: IncomingMessage, res: ServerResponse, next: () => void) => void) | null = null
  let userHandlerLoaded = false

  return async function (incomingReq: IncomingMessage, res: ServerResponse): Promise<void> {
    // Lazy load user request handler on first request
    if (!userHandlerLoaded && typeof devServerConfig.requestListenerPath === 'string') {
      userHandlerLoaded = true
      try {
        const userModule = await import(devServerConfig.requestListenerPath)
        userRequestHandler = userModule.default || userModule
      } catch (e) {
        console.error('Failed to load user request handler:', e)
      }
    }
    async function defaultHandler(): Promise<void> {
      try {
        const req = normalizeHttpRequest(devServerConfig, incomingReq)

        if (!req.url) {
          return serverCtx.serve302(req, res)
        }

        // Ping route for health checks
        if (devServerConfig.pingRoute !== null && req.pathname === devServerConfig.pingRoute) {
          try {
            const result = await serverCtx.getBuildResults()
            if (!result.hasSuccessfulBuild) {
              return serverCtx.serve500(req, res, 'Build not successful', 'build error')
            }
            res.writeHead(200, 'OK')
            res.write('OK')
            res.end()
          } catch {
            serverCtx.serve500(req, res, 'Error getting build results', 'ping error')
          }
          return
        }

        // Dev client routes
        if (isDevClient(req.pathname!) && devServerConfig.websocket) {
          return serveDevClient(devServerConfig, serverCtx, req, res)
        }

        // Dev module routes
        if (isDevModule(req.pathname!)) {
          return serveDevNodeModule(serverCtx, req, res)
        }

        // Validate base path
        if (!isValidUrlBasePath(devServerConfig.basePath!, req.url)) {
          return serverCtx.serve404(
            req,
            res,
            'invalid basePath',
            `404 File Not Found, base path: ${devServerConfig.basePath}`
          )
        }

        // SSR routes
        if (devServerConfig.ssr) {
          if (isExtensionLessPath(req.url.pathname)) {
            return ssrPageRequest(devServerConfig, serverCtx, req, res)
          }
          if (isSsrStaticDataPath(req.url.pathname)) {
            return ssrStaticDataRequest(devServerConfig, serverCtx, req, res)
          }
        }

        // Static file serving
        req.stats = await serverCtx.sys.stat(req.filePath!)
        if (req.stats.isFile) {
          return serveFile(devServerConfig, serverCtx, req, res)
        }

        // Directory index
        if (req.stats.isDirectory) {
          return serveDirectoryIndex(devServerConfig, serverCtx, req, res)
        }

        // History API fallback
        const xSource = ['notfound']
        const validHistoryApi = isValidHistoryApi(devServerConfig, req)
        xSource.push(`validHistoryApi: ${validHistoryApi}`)

        if (validHistoryApi) {
          try {
            const indexFilePath = path.join(
              devServerConfig.root!,
              devServerConfig.historyApiFallback!.index!
            )
            xSource.push(`indexFilePath: ${indexFilePath}`)

            req.stats = await serverCtx.sys.stat(indexFilePath)
            if (req.stats.isFile) {
              req.filePath = indexFilePath
              return serveFile(devServerConfig, serverCtx, req, res)
            }
          } catch (e) {
            xSource.push(`notfound error: ${e}`)
          }
        }

        return serverCtx.serve404(req, res, xSource.join(', '))
      } catch (e) {
        // Use a minimal request object for error handling since req may not be defined
        const errorReq: HttpRequest = {
          method: (incomingReq.method || 'GET').toUpperCase() as HttpRequest['method'],
          acceptHeader: '',
          url: null,
          searchParams: null,
        }
        return serverCtx.serve500(errorReq, res, e, 'not found error')
      }
    }

    if (typeof userRequestHandler === 'function') {
      await userRequestHandler(incomingReq, res, defaultHandler)
    } else {
      await defaultHandler()
    }
  }
}

// =============================================================================
// Request Normalization
// =============================================================================

function normalizeHttpRequest(
  devServerConfig: DevServerConfig,
  incomingReq: IncomingMessage
): HttpRequest {
  const req: HttpRequest = {
    method: ((incomingReq.method || 'GET').toUpperCase() as HttpRequest['method']),
    headers: incomingReq.headers as Record<string, string>,
    acceptHeader:
      (incomingReq.headers &&
        typeof incomingReq.headers.accept === 'string' &&
        incomingReq.headers.accept) ||
      '',
    host:
      (incomingReq.headers &&
        typeof incomingReq.headers.host === 'string' &&
        incomingReq.headers.host) ||
      undefined,
    url: null,
    searchParams: null,
  }

  const incomingUrl = (incomingReq.url || '').trim() || null
  if (incomingUrl) {
    if (req.host) {
      req.url = new URL(incomingReq.url!, `http://${req.host}`)
    } else {
      req.url = new URL(incomingReq.url!, 'http://dev.stenciljs.com')
    }
    req.searchParams = req.url.searchParams
  }

  if (req.url) {
    const parts = req.url.pathname.replace(/\\/g, '/').split('/')

    req.pathname = parts.map((part) => decodeURIComponent(part)).join('/')
    if (req.pathname.length > 0 && !isDevClient(req.pathname)) {
      req.pathname = '/' + req.pathname.substring(devServerConfig.basePath!.length)
    }

    req.filePath = normalizePath(
      path.normalize(path.join(devServerConfig.root!, path.relative('/', req.pathname)))
    )
  }

  return req
}

export function isValidUrlBasePath(basePath: string, url: URL): boolean {
  let pathname = url.pathname
  if (!pathname.endsWith('/')) {
    pathname += '/'
  }
  if (!basePath.endsWith('/')) {
    basePath += '/'
  }
  return pathname.startsWith(basePath)
}

export function isValidHistoryApi(devServerConfig: DevServerConfig, req: HttpRequest): boolean {
  if (!devServerConfig.historyApiFallback) {
    return false
  }
  if (req.method !== 'GET') {
    return false
  }
  if (!req.acceptHeader.includes('text/html')) {
    return false
  }
  if (!devServerConfig.historyApiFallback.disableDotRule && req.pathname?.includes('.')) {
    return false
  }
  return true
}

// =============================================================================
// Static File Serving
// =============================================================================

const urlVersionIds = new Map<string, string>()

export async function serveFile(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext,
  req: HttpRequest,
  res: ServerResponse
): Promise<void> {
  try {
    if (isSimpleText(req.filePath!)) {
      let content = await serverCtx.sys.readFile(req.filePath!, 'utf8')

      if (devServerConfig.websocket && isHtmlFile(req.filePath!) && !isDevServerClient(req.pathname!)) {
        content = appendDevServerClientScript(devServerConfig, req, content)
      } else if (isCssFile(req.filePath!)) {
        content = updateStyleUrls(req.url!, content)
      }

      if (shouldCompress(devServerConfig, req)) {
        res.writeHead(
          200,
          responseHeaders({
            'content-type': getContentType(req.filePath!) + '; charset=utf-8',
            'content-encoding': 'gzip',
            vary: 'Accept-Encoding',
          })
        )

        zlib.gzip(content, { level: 9 }, (_, data) => {
          res.end(data)
        })
      } else {
        res.writeHead(
          200,
          responseHeaders({
            'content-type': getContentType(req.filePath!) + '; charset=utf-8',
            'content-length': Buffer.byteLength(content, 'utf8'),
          })
        )
        res.write(content)
        res.end()
      }
    } else {
      const readStream = fs.createReadStream(req.filePath!)

      // Handle stream errors before piping to avoid "headers already sent" errors
      readStream.on('error', (err) => {
        if (!res.headersSent) {
          serverCtx.serve500(req, res, err, 'serveFile')
        } else {
          // Headers already sent, just end the response
          res.end()
        }
      })

      res.writeHead(
        200,
        responseHeaders({
          'content-type': getContentType(req.filePath!),
          'content-length': req.stats!.size,
        })
      )
      readStream.pipe(res)
    }

    serverCtx.logRequest(req, 200)
  } catch (e) {
    serverCtx.serve500(req, res, e, 'serveFile')
  }
}

function updateStyleUrls(url: URL, oldCss: string): string {
  const versionId = url.searchParams.get('s-hmr')
  const hmrUrls = url.searchParams.get('s-hmr-urls')

  if (versionId && hmrUrls) {
    hmrUrls.split(',').forEach((hmrUrl) => {
      urlVersionIds.set(hmrUrl, versionId)
    })
  }

  const reg = /url\((['"]?)(.*)\1\)/gi
  let result
  let newCss = oldCss

  while ((result = reg.exec(oldCss)) !== null) {
    const oldUrl = result[2]
    const parsedUrl = new URL(oldUrl, url)
    const fileName = path.basename(parsedUrl.pathname)
    const cachedVersionId = urlVersionIds.get(fileName)

    if (!cachedVersionId) {
      continue
    }

    parsedUrl.searchParams.set('s-hmr', cachedVersionId)
    newCss = newCss.replace(oldUrl, parsedUrl.pathname)
  }

  return newCss
}

export function appendDevServerClientScript(
  devServerConfig: DevServerConfig,
  req: HttpRequest,
  content: string
): string {
  const devServerClientUrl = getDevServerClientUrl(
    devServerConfig,
    req.headers?.['x-forwarded-host'] ?? req.host,
    req.headers?.['x-forwarded-proto']
  )
  const iframe = `<iframe title="Stencil Dev Server Connector ${VERSION} &#9889;" src="${devServerClientUrl}" style="display:block;width:0;height:0;border:0;visibility:hidden" aria-hidden="true"></iframe>`
  return appendDevServerClientIframe(content, iframe)
}

export function appendDevServerClientIframe(content: string, iframe: string): string {
  if (content.includes('</body>')) {
    return content.replace('</body>', `${iframe}</body>`)
  }
  if (content.includes('</html>')) {
    return content.replace('</html>', `${iframe}</html>`)
  }
  return `${content}${iframe}`
}

// =============================================================================
// Dev Client Serving
// =============================================================================

async function serveDevClient(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext,
  req: HttpRequest,
  res: ServerResponse
): Promise<void> {
  try {
    if (isOpenInEditor(req.pathname!)) {
      return serveOpenInEditor(serverCtx, req, res)
    }

    if (isDevServerClient(req.pathname!)) {
      return serveDevClientScript(devServerConfig, serverCtx, req, res)
    }

    if (isInitialDevServerLoad(req.pathname!)) {
      req.filePath = path.join(devServerConfig.devServerDir!, 'templates', 'initial-load.html')
    } else {
      // Strip the /~dev-server/ prefix and serve from appropriate directory
      const subPath = req.pathname!.replace(DEV_SERVER_URL + '/', '')
      if (subPath.startsWith('client/')) {
        // Serve client JS module
        req.filePath = path.join(devServerConfig.devServerDir!, subPath)
      } else {
        // Serve static assets (favicon, etc.)
        req.filePath = path.join(devServerConfig.devServerDir!, 'static', subPath)
      }
    }

    try {
      req.stats = await serverCtx.sys.stat(req.filePath!)
      if (req.stats.isFile) {
        return serveFile(devServerConfig, serverCtx, req, res)
      }
      return serverCtx.serve404(req, res, 'serveDevClient not file')
    } catch (e) {
      return serverCtx.serve404(req, res, `serveDevClient stats error ${e}`)
    }
  } catch (e) {
    return serverCtx.serve500(req, res, e, 'serveDevClient')
  }
}

async function serveDevClientScript(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext,
  req: HttpRequest,
  res: ServerResponse
): Promise<void> {
  try {
    if (serverCtx.connectorHtml == null) {
      const filePath = path.join(devServerConfig.devServerDir!, 'connector.html')

      serverCtx.connectorHtml = serverCtx.sys.readFileSync(filePath, 'utf8')
      if (typeof serverCtx.connectorHtml !== 'string') {
        return serverCtx.serve404(req, res, 'serveDevClientScript')
      }

      const devClientConfig: DevClientConfig = {
        basePath: devServerConfig.basePath!,
        editors: await getEditors(),
        reloadStrategy: devServerConfig.reloadStrategy!,
      }

      serverCtx.connectorHtml = serverCtx.connectorHtml.replace(
        'window.__DEV_CLIENT_CONFIG__',
        JSON.stringify(devClientConfig)
      )
    }

    res.writeHead(
      200,
      responseHeaders({
        'content-type': 'text/html; charset=utf-8',
      })
    )
    res.write(serverCtx.connectorHtml)
    res.end()
  } catch (e) {
    return serverCtx.serve500(req, res, e, 'serveDevClientScript')
  }
}

// =============================================================================
// Dev Node Module Serving
// =============================================================================

async function serveDevNodeModule(
  serverCtx: DevServerContext,
  req: HttpRequest,
  res: ServerResponse
): Promise<void> {
  try {
    const results = await serverCtx.getCompilerRequest(req.pathname!)

    const headers: Record<string, string | number | boolean> = {
      'content-type': 'application/javascript; charset=utf-8',
      'content-length': Buffer.byteLength(results.content, 'utf8'),
      'x-dev-node-module-id': results.nodeModuleId,
      'x-dev-node-module-version': results.nodeModuleVersion,
      'x-dev-node-module-resolved-path': results.nodeResolvedPath,
      'x-dev-node-module-cache-path': results.cachePath,
      'x-dev-node-module-cache-hit': results.cacheHit,
    }

    res.writeHead(results.status, responseHeaders(headers as any))
    res.write(results.content)
    res.end()
  } catch (e) {
    serverCtx.serve500(req, res, e, 'serveDevNodeModule')
  }
}

// =============================================================================
// Directory Index Serving
// =============================================================================

interface DirectoryItem {
  name: string
  pathname: string
  isDirectory: boolean
}

async function serveDirectoryIndex(
  devServerConfig: DevServerConfig,
  serverCtx: DevServerContext,
  req: HttpRequest,
  res: ServerResponse
): Promise<void> {
  const indexFilePath = path.join(req.filePath!, 'index.html')
  req.stats = await serverCtx.sys.stat(indexFilePath)

  if (req.stats.isFile) {
    req.filePath = indexFilePath
    return serveFile(devServerConfig, serverCtx, req, res)
  }

  if (!req.pathname!.endsWith('/')) {
    return serverCtx.serve302(req, res, req.pathname + '/')
  }

  try {
    const dirFilePaths = await serverCtx.sys.readDir(req.filePath!)

    try {
      if (serverCtx.dirTemplate == null) {
        const dirTemplatePath = path.join(
          devServerConfig.devServerDir!,
          'templates',
          'directory-index.html'
        )
        serverCtx.dirTemplate = serverCtx.sys.readFileSync(dirTemplatePath)
      }

      const files = await getDirectoryFiles(serverCtx.sys, req.url!, dirFilePaths)

      const templateHtml = serverCtx.dirTemplate
        .replace('{{title}}', req.pathname!)
        .replace('{{nav}}', getDirectoryNav(req.pathname!))
        .replace('{{files}}', files)

      serverCtx.logRequest(req, 200)

      res.writeHead(
        200,
        responseHeaders({
          'content-type': 'text/html; charset=utf-8',
          'x-directory-index': req.pathname,
        })
      )

      res.write(templateHtml)
      res.end()
    } catch (e) {
      return serverCtx.serve500(req, res, e, 'serveDirectoryIndex')
    }
  } catch {
    return serverCtx.serve404(req, res, 'serveDirectoryIndex')
  }
}

async function getDirectoryFiles(
  sys: DevServerContext['sys'],
  baseUrl: URL,
  dirItemNames: string[]
): Promise<string> {
  const items = await getDirectoryItems(sys, baseUrl, dirItemNames)

  if (baseUrl.pathname !== '/') {
    items.unshift({
      isDirectory: true,
      pathname: '../',
      name: '..',
    })
  }

  return items
    .map((item) => {
      return `
        <li class="${item.isDirectory ? 'directory' : 'file'}">
          <a href="${item.pathname}">
            <span class="icon"></span>
            <span>${item.name}</span>
          </a>
        </li>`
    })
    .join('')
}

async function getDirectoryItems(
  sys: DevServerContext['sys'],
  baseUrl: URL,
  dirFilePaths: string[]
): Promise<DirectoryItem[]> {
  const items = await Promise.all(
    dirFilePaths.map(async (dirFilePath) => {
      const fileName = path.basename(dirFilePath)
      const url = new URL(fileName, baseUrl)
      const stats = await sys.stat(dirFilePath)

      return {
        name: fileName,
        pathname: url.pathname,
        isDirectory: stats.isDirectory,
      }
    })
  )
  return items
}

function getDirectoryNav(pathName: string): string {
  const dirs = pathName.split('/')
  dirs.pop()

  let url = ''

  return (
    dirs
      .map((dir, index) => {
        url += dir + '/'
        const text = index === 0 ? '~' : dir
        return `<a href="${url}">${text}</a>`
      })
      .join('<span>/</span>') + '<span>/</span>'
  )
}

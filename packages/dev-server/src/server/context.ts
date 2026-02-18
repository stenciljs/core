/**
 * Server context factory.
 * Creates the shared context object passed to request handlers.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { inspect } from 'node:util'
import type { ServerResponse } from 'node:http'

import type {
  CompilerBuildResults,
  CompilerRequestResponse,
  CompilerSystem,
  DevServerConfig,
  DevServerContext,
  DevServerSendMessage,
  HttpRequest,
} from './types.js'
import { responseHeaders } from './utils.js'

export interface CompilerRequestResolve {
  path: string
  resolve: (results: CompilerRequestResponse) => void
  reject: (msg: unknown) => void
}

export interface BuildRequestResolve {
  resolve: (results: CompilerBuildResults) => void
  reject: (msg: unknown) => void
}

export function createServerContext(
  sys: CompilerSystem,
  sendMsg: DevServerSendMessage,
  devServerConfig: DevServerConfig,
  buildResultsResolves: BuildRequestResolve[],
  compilerRequestResolves: CompilerRequestResolve[]
): DevServerContext {
  const logRequest = (req: HttpRequest, status: number): void => {
    if (devServerConfig) {
      sendMsg({
        requestLog: {
          method: req.method || '?',
          url: req.pathname || '?',
          status,
        },
      })
    }
  }

  const serve500 = (
    req: HttpRequest,
    res: ServerResponse,
    error: unknown,
    xSource: string
  ): void => {
    try {
      res.writeHead(
        500,
        responseHeaders({
          'content-type': 'text/plain; charset=utf-8',
          'x-source': xSource,
        })
      )
      res.write(inspect(error))
      res.end()
      logRequest(req, 500)
    } catch (e) {
      sendMsg({ error: { message: 'serve500: ' + e } })
    }
  }

  const serve404 = (
    req: HttpRequest,
    res: ServerResponse,
    xSource: string,
    content: string | null = null
  ): void => {
    try {
      if (req.pathname === '/favicon.ico') {
        const defaultFavicon = path.join(devServerConfig.devServerDir!, 'static', 'favicon.ico')
        res.writeHead(
          200,
          responseHeaders({
            'content-type': 'image/x-icon',
            'x-source': `favicon: ${xSource}`,
          })
        )
        const rs = fs.createReadStream(defaultFavicon)
        rs.on('error', (err) => {
          res.writeHead(
            404,
            responseHeaders({
              'content-type': 'text/plain; charset=utf-8',
              'x-source': `createReadStream error: ${err}, ${xSource}`,
            })
          )
          res.write(inspect(err))
          res.end()
        })
        rs.pipe(res)
        return
      }

      if (content == null) {
        content = ['404 File Not Found', 'Url: ' + req.pathname, 'File: ' + req.filePath].join('\n')
      }
      res.writeHead(
        404,
        responseHeaders({
          'content-type': 'text/plain; charset=utf-8',
          'x-source': xSource,
        })
      )
      res.write(content)
      res.end()

      logRequest(req, 404)
    } catch (e) {
      serve500(req, res, e, xSource)
    }
  }

  const serve302 = (req: HttpRequest, res: ServerResponse, pathname: string | null = null): void => {
    logRequest(req, 302)
    res.writeHead(302, { location: pathname || devServerConfig.basePath || '/' })
    res.end()
  }

  const getBuildResults = (): Promise<CompilerBuildResults> =>
    new Promise((resolve, reject) => {
      if (serverCtx.isServerListening) {
        buildResultsResolves.push({ resolve, reject })
        sendMsg({ requestBuildResults: true })
      } else {
        reject('dev server closed')
      }
    })

  const getCompilerRequest = (compilerRequestPath: string): Promise<CompilerRequestResponse> =>
    new Promise((resolve, reject) => {
      if (serverCtx.isServerListening) {
        compilerRequestResolves.push({
          path: compilerRequestPath,
          resolve,
          reject,
        })
        sendMsg({ compilerRequestPath })
      } else {
        reject('dev server closed')
      }
    })

  const serverCtx: DevServerContext = {
    connectorHtml: null,
    dirTemplate: null,
    getBuildResults,
    getCompilerRequest,
    isServerListening: false,
    logRequest,
    prerenderConfig: null,
    serve302,
    serve404,
    serve500,
    sys,
  }

  return serverCtx
}

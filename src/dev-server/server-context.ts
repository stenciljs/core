import fs from 'graceful-fs';
import path from 'path';
import util from 'util';

import type * as d from '../declarations';
import { responseHeaders } from './dev-server-utils';

export function createServerContext(
  sys: d.CompilerSystem,
  sendMsg: d.DevServerSendMessage,
  devServerConfig: d.DevServerConfig,
  buildResultsResolves: BuildRequestResolve[],
  compilerRequestResolves: CompilerRequestResolve[],
) {
  const logRequest = (req: d.HttpRequest, status: number) => {
    if (devServerConfig) {
      sendMsg({
        requestLog: {
          method: req.method || '?',
          url: req.pathname || '?',
          status,
        },
      });
    }
  };

  const serve500 = (req: d.HttpRequest, res: any, error: any, xSource: string) => {
    try {
      res.writeHead(
        500,
        responseHeaders({
          'content-type': 'text/plain; charset=utf-8',
          'x-source': xSource,
        }),
      );
      res.write(util.inspect(error));
      res.end();
      logRequest(req, 500);
    } catch (e) {
      sendMsg({ error: { message: 'serve500: ' + e } });
    }
  };

  const serve404 = (req: d.HttpRequest, res: any, xSource: string, content: string = null) => {
    try {
      if (req.pathname === '/favicon.ico') {
        const defaultFavicon = path.join(devServerConfig.devServerDir, 'static', 'favicon.ico');
        res.writeHead(
          200,
          responseHeaders({
            'content-type': 'image/x-icon',
            'x-source': `favicon: ${xSource}`,
          }),
        );
        const rs = fs.createReadStream(defaultFavicon);
        rs.on('error', (err) => {
          res.writeHead(
            404,
            responseHeaders({
              'content-type': 'text/plain; charset=utf-8',
              'x-source': `createReadStream error: ${err}, ${xSource}`,
            }),
          );
          res.write(util.inspect(err));
          res.end();
        });
        rs.pipe(res);
        return;
      }

      if (content == null) {
        content = ['404 File Not Found', 'Url: ' + req.pathname, 'File: ' + req.filePath].join('\n');
      }
      res.writeHead(
        404,
        responseHeaders({
          'content-type': 'text/plain; charset=utf-8',
          'x-source': xSource,
        }),
      );
      res.write(content);
      res.end();

      logRequest(req, 400);
    } catch (e) {
      serve500(req, res, e, xSource);
    }
  };

  const serve302 = (req: d.HttpRequest, res: any, pathname: string = null) => {
    logRequest(req, 302);
    res.writeHead(302, { location: pathname || devServerConfig.basePath || '/' });
    res.end();
  };

  const getBuildResults = () =>
    new Promise<d.CompilerBuildResults>((resolve, reject) => {
      if (serverCtx.isServerListening) {
        buildResultsResolves.push({ resolve, reject });
        sendMsg({ requestBuildResults: true });
      } else {
        reject('dev server closed');
      }
    });

  const getCompilerRequest = (compilerRequestPath: string) =>
    new Promise<d.CompilerRequestResponse>((resolve, reject) => {
      if (serverCtx.isServerListening) {
        compilerRequestResolves.push({
          path: compilerRequestPath,
          resolve,
          reject,
        });
        sendMsg({ compilerRequestPath });
      } else {
        reject('dev server closed');
      }
    });

  const serverCtx: d.DevServerContext = {
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
  };

  return serverCtx;
}

export interface CompilerRequestResolve {
  path: string;
  resolve: (results: d.CompilerRequestResponse) => void;
  reject: (msg: any) => void;
}

export interface BuildRequestResolve {
  resolve: (results: d.CompilerBuildResults) => void;
  reject: (msg: any) => void;
}

import type { ServerResponse } from 'http';
import path from 'path';

import type * as d from '../declarations';
import { DEV_SERVER_URL } from './dev-server-constants';
import { isDevServerClient, isInitialDevServerLoad, isOpenInEditor, responseHeaders } from './dev-server-utils';
import { getEditors, serveOpenInEditor } from './open-in-editor';
import { serveFile } from './serve-file';

export async function serveDevClient(
  devServerConfig: d.DevServerConfig,
  serverCtx: d.DevServerContext,
  req: d.HttpRequest,
  res: ServerResponse,
) {
  try {
    if (isOpenInEditor(req.pathname)) {
      return serveOpenInEditor(serverCtx, req, res);
    }

    if (isDevServerClient(req.pathname)) {
      return serveDevClientScript(devServerConfig, serverCtx, req, res);
    }

    if (isInitialDevServerLoad(req.pathname)) {
      req.filePath = path.join(devServerConfig.devServerDir, 'templates', 'initial-load.html');
    } else {
      const staticFile = req.pathname.replace(DEV_SERVER_URL + '/', '');
      req.filePath = path.join(devServerConfig.devServerDir, 'static', staticFile);
    }

    try {
      req.stats = await serverCtx.sys.stat(req.filePath);
      if (req.stats.isFile) {
        return serveFile(devServerConfig, serverCtx, req, res);
      }
      return serverCtx.serve404(req, res, 'serveDevClient not file');
    } catch (e) {
      return serverCtx.serve404(req, res, `serveDevClient stats error ${e}`);
    }
  } catch (e) {
    return serverCtx.serve500(req, res, e, 'serveDevClient');
  }
}

async function serveDevClientScript(
  devServerConfig: d.DevServerConfig,
  serverCtx: d.DevServerContext,
  req: d.HttpRequest,
  res: ServerResponse,
) {
  try {
    if (serverCtx.connectorHtml == null) {
      const filePath = path.join(devServerConfig.devServerDir, 'connector.html');

      serverCtx.connectorHtml = serverCtx.sys.readFileSync(filePath, 'utf8');
      if (typeof serverCtx.connectorHtml !== 'string') {
        return serverCtx.serve404(req, res, `serveDevClientScript`);
      }

      const devClientConfig: d.DevClientConfig = {
        basePath: devServerConfig.basePath,
        editors: await getEditors(),
        reloadStrategy: devServerConfig.reloadStrategy,
      };

      serverCtx.connectorHtml = serverCtx.connectorHtml.replace(
        'window.__DEV_CLIENT_CONFIG__',
        JSON.stringify(devClientConfig),
      );
    }

    res.writeHead(
      200,
      responseHeaders({
        'content-type': 'text/html; charset=utf-8',
      }),
    );
    res.write(serverCtx.connectorHtml);
    res.end();
  } catch (e) {
    return serverCtx.serve500(req, res, e, `serveDevClientScript`);
  }
}

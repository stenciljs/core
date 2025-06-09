import type { ServerResponse } from 'http';

import type * as d from '../declarations';
import { responseHeaders } from './dev-server-utils';

export async function serveDevNodeModule(serverCtx: d.DevServerContext, req: d.HttpRequest, res: ServerResponse) {
  try {
    const results = await serverCtx.getCompilerRequest(req.pathname);

    const headers = {
      'content-type': 'application/javascript; charset=utf-8',
      'content-length': Buffer.byteLength(results.content, 'utf8'),
      'x-dev-node-module-id': results.nodeModuleId,
      'x-dev-node-module-version': results.nodeModuleVersion,
      'x-dev-node-module-resolved-path': results.nodeResolvedPath,
      'x-dev-node-module-cache-path': results.cachePath,
      'x-dev-node-module-cache-hit': results.cacheHit,
    };

    res.writeHead(results.status, responseHeaders(headers));
    res.write(results.content);
    res.end();
  } catch (e) {
    serverCtx.serve500(req, res, e, `serveDevNodeModule`);
  }
}

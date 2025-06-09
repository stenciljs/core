import { Buffer } from 'buffer';
import fs from 'graceful-fs';
import type { ServerResponse } from 'http';
import path from 'path';
import * as zlib from 'zlib';

import type * as d from '../declarations';
import { version } from '../version';
import * as util from './dev-server-utils';

export async function serveFile(
  devServerConfig: d.DevServerConfig,
  serverCtx: d.DevServerContext,
  req: d.HttpRequest,
  res: ServerResponse,
) {
  try {
    if (util.isSimpleText(req.filePath)) {
      // easy text file, use the internal cache
      let content = await serverCtx.sys.readFile(req.filePath, 'utf8');

      if (devServerConfig.websocket && util.isHtmlFile(req.filePath) && !util.isDevServerClient(req.pathname)) {
        // auto inject our dev server script
        content = appendDevServerClientScript(devServerConfig, req, content);
      } else if (util.isCssFile(req.filePath)) {
        content = updateStyleUrls(req.url, content);
      }

      if (util.shouldCompress(devServerConfig, req)) {
        // let's gzip this well known web dev text file
        res.writeHead(
          200,
          util.responseHeaders({
            'content-type': util.getContentType(req.filePath) + '; charset=utf-8',
            'content-encoding': 'gzip',
            vary: 'Accept-Encoding',
          }),
        );

        zlib.gzip(content, { level: 9 }, (_, data) => {
          res.end(data);
        });
      } else {
        // let's not gzip this file
        res.writeHead(
          200,
          util.responseHeaders({
            'content-type': util.getContentType(req.filePath) + '; charset=utf-8',
            'content-length': Buffer.byteLength(content, 'utf8'),
          }),
        );
        res.write(content);
        res.end();
      }
    } else {
      // non-well-known text file or other file, probably best we use a stream
      // but don't bother trying to gzip this file for the dev server
      res.writeHead(
        200,
        util.responseHeaders({
          'content-type': util.getContentType(req.filePath),
          'content-length': req.stats.size,
        }),
      );
      fs.createReadStream(req.filePath).pipe(res);
    }

    serverCtx.logRequest(req, 200);
  } catch (e) {
    serverCtx.serve500(req, res, e, 'serveFile');
  }
}

function updateStyleUrls(url: URL, oldCss: string) {
  const versionId = url.searchParams.get('s-hmr');
  const hmrUrls = url.searchParams.get('s-hmr-urls');

  if (versionId && hmrUrls) {
    (hmrUrls as string).split(',').forEach((hmrUrl) => {
      urlVersionIds.set(hmrUrl, versionId as string);
    });
  }

  const reg = /url\((['"]?)(.*)\1\)/gi;
  let result;
  let newCss = oldCss;

  while ((result = reg.exec(oldCss)) !== null) {
    const oldUrl = result[2];

    const parsedUrl = new URL(oldUrl, url);

    const fileName = path.basename(parsedUrl.pathname);
    const versionId = urlVersionIds.get(fileName);
    if (!versionId) {
      continue;
    }

    parsedUrl.searchParams.set('s-hmr', versionId);

    newCss = newCss.replace(oldUrl, parsedUrl.pathname);
  }

  return newCss;
}

const urlVersionIds = new Map<string, string>();

export function appendDevServerClientScript(devServerConfig: d.DevServerConfig, req: d.HttpRequest, content: string) {
  const devServerClientUrl = util.getDevServerClientUrl(
    devServerConfig,
    req.headers?.['x-forwarded-host'] ?? req.host,
    req.headers?.['x-forwarded-proto'],
  );
  const iframe = `<iframe title="Stencil Dev Server Connector ${version} &#9889;" src="${devServerClientUrl}" style="display:block;width:0;height:0;border:0;visibility:hidden" aria-hidden="true"></iframe>`;
  return appendDevServerClientIframe(content, iframe);
}

export function appendDevServerClientIframe(content: string, iframe: string) {
  if (content.includes('</body>')) {
    return content.replace('</body>', `${iframe}</body>`);
  }
  if (content.includes('</html>')) {
    return content.replace('</html>', `${iframe}</html>`);
  }
  return `${content}${iframe}`;
}

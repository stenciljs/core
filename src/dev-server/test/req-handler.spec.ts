import type * as d from '@stencil/core/declarations';
import { mockConfig, mockLoadConfigInit } from '@stencil/core/testing';
import { normalizePath } from '@utils';
import nodeFs from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';

import { validateConfig } from '../../compiler/config/validate-config';
import { validateDevServer } from '../../compiler/config/validate-dev-server';
import { createSystem } from '../../compiler/sys/stencil-sys';
import { createRequestHandler } from '../request-handler';
import { appendDevServerClientIframe } from '../serve-file';
import { createServerContext } from '../server-context';

describe('request-handler', () => {
  let devServerConfig: d.DevServerConfig;
  let serverCtx: d.DevServerContext;
  let sys: d.CompilerSystem;
  let req: IncomingMessage;
  let res: TestServerResponse;
  let sendMsg: d.DevServerSendMessage;
  const root = path.resolve('/');
  const tmplDirPath = normalizePath(path.join(__dirname, '..', 'templates', 'directory-index.html'));
  const tmplDir = nodeFs.readFileSync(tmplDirPath, 'utf8');

  beforeEach(async () => {
    sys = createSystem();

    const validated = validateConfig(mockConfig(), mockLoadConfigInit());
    const stencilConfig = validated.config;
    stencilConfig.flags.serve = true;

    stencilConfig.devServer = {
      devServerDir: normalizePath(path.join(__dirname, '..')),
      root: normalizePath(path.join(root, 'www')),
      basePath: '/',
    };

    await sys.createDir(stencilConfig.devServer.root);
    await sys.writeFile(path.join(stencilConfig.devServer.devServerDir, 'templates', 'directory-index.html'), tmplDir);

    devServerConfig = validateDevServer(stencilConfig, []);
    req = {} as any;
    res = {} as any;

    res.writeHead = (statusCode: number, headers: any): any => {
      res.$statusCode = statusCode;
      res.$headers = headers;
      res.$contentType = headers && headers['content-type'];
    };

    res.write = (content: any) => {
      res.$contentWrite = content;
      return true;
    };

    res.end = () => {
      res.$content = res.$contentWrite;
      return this;
    };

    sendMsg = () => {};

    serverCtx = createServerContext(sys, sendMsg, devServerConfig, [], []);
  });

  describe('historyApiFallback', () => {
    it('should load historyApiFallback index.html when dot in the url disableDotRule true', async () => {
      await sys.writeFile(path.join(root, 'www', 'index.html'), `root-index`);
      devServerConfig.historyApiFallback = {
        index: 'index.html',
        disableDotRule: true,
      };
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      };
      req.url = '/about.us';
      req.method = 'GET';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
    });

    it('should not load historyApiFallback index.html when dot in the url', async () => {
      await sys.writeFile(path.join(root, 'www', 'index.html'), `root-index`);
      devServerConfig.historyApiFallback = {
        index: 'index.html',
      };
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      };
      req.url = '/about.us';
      req.method = 'GET';

      await handler(req, res);
      expect(res.$statusCode).toBe(404);
    });

    it('should not load historyApiFallback index.html when no text/html accept header', async () => {
      await sys.writeFile(path.join(root, 'www', 'index.html'), `root-index`);
      devServerConfig.historyApiFallback = {
        index: 'index.html',
      };
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.headers = {
        accept: '*/*',
      };
      req.url = '/about-us';
      req.method = 'GET';

      await handler(req, res);
      expect(res.$statusCode).toBe(404);
    });

    it('should not load historyApiFallback index.html when not GET request', async () => {
      await sys.writeFile(path.join(root, 'www', 'index.html'), `root-index`);
      devServerConfig.historyApiFallback = {
        index: 'index.html',
      };
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      };
      req.url = '/about-us';
      req.method = 'POST';

      await handler(req, res);
      expect(res.$statusCode).toBe(404);
    });

    it('should load historyApiFallback index.html when no trailing slash', async () => {
      await sys.writeFile(path.join(root, 'www', 'index.html'), `root-index`);
      devServerConfig.historyApiFallback = {
        index: 'index.html',
      };
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      };
      req.url = '/about-us';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('root-index');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('should load historyApiFallback index.html when trailing slash', async () => {
      await sys.writeFile(path.join(root, 'www', 'index.html'), `root-index`);
      devServerConfig.historyApiFallback = {
        index: 'index.html',
      };
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      };
      req.url = '/about-us/';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('root-index');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('should list directory when ended in slash and not using historyApiFallback', async () => {
      await sys.createDir(path.join(root, 'www', 'about-us'));
      await sys.writeFile(path.join(root, 'www', 'about-us', 'somefile1.html'), `somefile1`);
      await sys.writeFile(path.join(root, 'www', 'about-us', 'somefile2.html'), `somefile2`);
      devServerConfig.historyApiFallback = null;
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      };
      req.url = '/about-us/';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('tmpl-dir');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });
  });

  describe('serve directory index', () => {
    it('should load index.html in directory', async () => {
      await sys.createDir(path.join(root, 'www', 'about-us'));
      await sys.writeFile(path.join(root, 'www', 'about-us.html'), `about-us.html page`);
      await sys.writeFile(path.join(root, 'www', 'about-us', 'index.html'), `about-us-index-directory`);
      devServerConfig.historyApiFallback = null;
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      };
      req.url = '/about-us/';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('about-us-index-directory');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('should redirect directory w/ slash', async () => {
      await sys.createDir(path.join(root, 'www', 'about-us'));
      await sys.writeFile(path.join(root, 'www', 'about-us', 'somefile1.html'), `somefile1`);
      await sys.writeFile(path.join(root, 'www', 'about-us', 'somefile2.html'), `somefile2`);
      devServerConfig.historyApiFallback = {};
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.headers = {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      };
      req.url = '/about-us';

      await handler(req, res);
      expect(res.$statusCode).toBe(302);
      expect(res.$headers.location).toBe('/about-us/');
    });

    it('get directory index.html with no trailing slash', async () => {
      await sys.createDir(path.join(root, 'www', 'about-us'));
      await sys.writeFile(path.join(root, 'www', 'about-us', 'index.html'), `aboutus`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/about-us';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('aboutus');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('get directory index.html with trailing slash and base url', async () => {
      devServerConfig.basePath = '/my-base-url/';
      await sys.createDir(path.join(root, 'www', 'about-us'));
      await sys.writeFile(path.join(root, 'www', 'about-us', 'index.html'), `aboutus`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/my-base-url/about-us/';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('aboutus');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('get directory index.html without trailing slash and base url', async () => {
      devServerConfig.basePath = '/my-base-url/';
      await sys.createDir(path.join(root, 'www', 'about-us'));
      await sys.writeFile(path.join(root, 'www', 'about-us', 'index.html'), `aboutus`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/my-base-url/about-us';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('aboutus');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('get directory index.html with trailing slash', async () => {
      await sys.createDir(path.join(root, 'www', 'about-us'));
      await sys.writeFile(path.join(root, 'www', 'about-us', 'index.html'), `aboutus`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/about-us/';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('aboutus');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });
  });

  describe('error not found static files', () => {
    it('not find file', async () => {
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/www/index.html';

      await handler(req, res);
      expect(res.$statusCode).toBe(404);
      expect(res.$content).toContain('/index.html');
      expect(res.$contentType).toBe('text/plain; charset=utf-8');
    });
  });

  describe('root index', () => {
    it('serve directory listing when no index.html', async () => {
      await sys.writeFile(path.join(root, 'www', 'styles.css'), `/* hi */`);
      await sys.writeFile(path.join(root, 'www', 'scripts.js'), `// hi`);
      await sys.writeFile(path.join(root, 'www', '.gitignore'), `# gitignore`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('tmpl-dir');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('serve root index.html w/ querystring', async () => {
      await sys.writeFile(path.join(root, 'www', 'index.html'), `hello`);
      devServerConfig.gzip = false;
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/?qs=123';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('hello');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('serve root index.html w/ base url without url trailing slash', async () => {
      devServerConfig.basePath = '/my-base-url/';
      await sys.writeFile(path.join(root, 'www', 'index.html'), `hello`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/my-base-url';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('hello');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('serve root index.html w/ base url without trailing slash, with trailing slash url', async () => {
      devServerConfig.basePath = '/my-base-url';
      await sys.writeFile(path.join(root, 'www', 'index.html'), `hello`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/my-base-url/';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('hello');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('serve root index.html w/ base url w/ index.html', async () => {
      devServerConfig.basePath = '/my-base-url/';
      await sys.writeFile(path.join(root, 'www', 'index.html'), `hello`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/my-base-url/index.html';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('hello');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('serve root index.html w/ base url', async () => {
      devServerConfig.basePath = '/my-base-url/';
      await sys.writeFile(path.join(root, 'www', 'index.html'), `hello`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/my-base-url/';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('hello');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('serve root index.html', async () => {
      await sys.writeFile(path.join(root, 'www', 'index.html'), `hello`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content).toContain('hello');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('302 redirect to / when no path at all', async () => {
      await sys.writeFile(path.join(root, 'www', 'index.html'), `hello`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '';

      await handler(req, res);
      expect(res.$statusCode).toBe(302);
      expect(res.$headers.location).toBe('/');
    });
  });

  describe('serve static text files', () => {
    it('should load file w/ querystring', async () => {
      await sys.writeFile(path.join(root, 'www', 'scripts', 'file1.html'), `html`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/scripts/file1.html?qs=1234';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content.split('\n')[0]).toContain('html');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });

    it('should load html file', async () => {
      await sys.writeFile(path.join(root, 'www', 'scripts', 'file1.html'), `html`);
      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/scripts/file1.html';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
      expect(res.$content.split('\n')[0]).toContain('html');
      expect(res.$contentType).toBe('text/html; charset=utf-8');
    });
  });

  describe('iframe connector', () => {
    it('appends to <body>', () => {
      const h = appendDevServerClientIframe(`<html><body>88mph</body></html>`, `<iframe></iframe>`);
      expect(h).toBe(`<html><body>88mph<iframe></iframe></body></html>`);
    });

    it('appends to <html>', () => {
      const h = appendDevServerClientIframe(`<html>88mph</html>`, `<iframe></iframe>`);
      expect(h).toBe(`<html>88mph<iframe></iframe></html>`);
    });

    it('appends to end', () => {
      const h = appendDevServerClientIframe(`88mph`, `<iframe></iframe>`);
      expect(h).toBe(`88mph<iframe></iframe>`);
    });
  });

  describe('pingRoute', () => {
    it('should return a 200 for successful build', async () => {
      serverCtx.getBuildResults = () =>
        Promise.resolve({ hasSuccessfulBuild: true }) as Promise<d.CompilerBuildResults>;

      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/ping';

      await handler(req, res);
      expect(res.$statusCode).toBe(200);
    });

    it('should return a 500 for unsuccessful build', async () => {
      serverCtx.getBuildResults = () =>
        Promise.resolve({ hasSuccessfulBuild: false }) as Promise<d.CompilerBuildResults>;

      const handler = createRequestHandler(devServerConfig, serverCtx);

      req.url = '/ping';

      await handler(req, res);
      expect(res.$statusCode).toBe(500);
    });
  });
});

interface TestServerResponse extends ServerResponse {
  $statusCode?: number;
  $headers?: any;
  $contentWrite?: string;
  $content?: string;
  $contentType?: string;
}

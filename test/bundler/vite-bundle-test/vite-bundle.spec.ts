import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer, Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join } from 'node:path';

import puppeteer, { Browser } from 'puppeteer';

let BASE_URL = '';
const DIST_DIR = join(__dirname, 'dist');

// Simple static file server for serving Vite-built files
function startStaticServer() {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };

  const server = createServer((req, res) => {
    const reqUrl = req.url || '/';
    const rel = reqUrl === '/' ? 'index.html' : reqUrl.replace(/^\//, '');
    const filePath = join(DIST_DIR, rel);

    try {
      const stat = statSync(filePath);
      if (stat.isFile()) {
        const ext = extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        if (ext === '.html') {
          // Rewrite absolute asset URLs to relative to avoid any base path issues
          let html = readFileSync(filePath, 'utf-8');
          html = html.replace(/(src|href)="\/assets\//g, '$1="assets/');
          res.end(html);
        } else {
          const stream = createReadStream(filePath);
          stream.on('error', () => {
            if (!res.headersSent) {
              res.writeHead(500);
            }
            res.end('Internal server error');
          });
          stream.pipe(res);
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise<Server>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

describe('vite-bundle', () => {
  let browser: Browser;
  let server: Server;

  beforeAll(async () => {
    server = await startStaticServer();
    const addr = server.address() as AddressInfo;
    BASE_URL = `http://127.0.0.1:${addr.port}`;
    browser = await puppeteer.launch({
      headless: true,
      args: ['--disable-gpu', '--no-sandbox', '--headless=new'],
    });
  });

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.close();
  });

  it('should load content from dynamic import', async () => {
    const page = await browser.newPage();

    try {
      await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle0' });

      // Ensure the custom element is defined
      await page.waitForFunction(() => !!customElements.get('my-component'), { timeout: 10000 });

      // Wait for the element to be present
      await page.waitForSelector('my-component', { timeout: 10000 });

      // Wait until shadowRoot exists (hydration complete)
      await page.waitForFunction(
        () => {
          const el = document.querySelector('my-component');
          return (
            !!el &&
            !!(el as any).shadowRoot &&
            !!(el as any).shadowRoot.textContent &&
            (el as any).shadowRoot.textContent.trim().length > 0
          );
        },
        { timeout: 10000 },
      );

      // Get text content from the shadow root
      const text = await page.evaluate(() => {
        const component = document.querySelector('my-component');
        return component?.shadowRoot?.textContent?.trim() || '';
      });

      expect(text).toBe("Hello, World! I'm Stencil 'Don't call me a framework' JS");
    } finally {
      await page.close();
    }
  });
});

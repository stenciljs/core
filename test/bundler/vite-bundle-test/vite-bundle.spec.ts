import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, Server } from 'node:http';
import { extname, join, resolve } from 'node:path';

import puppeteer, { Browser } from 'puppeteer';

const PORT = 8765;
const DIST_DIR = existsSync(join(__dirname, 'dist'))
  ? join(__dirname, 'dist')
  : resolve(__dirname, '..', 'vite-bundle-test', 'dist');

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
        createReadStream(filePath).pipe(res);
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
    server.listen(PORT, () => resolve(server));
  });
}

describe('vite-bundle', () => {
  let browser: Browser;
  let server: Server;

  beforeAll(async () => {
    server = await startStaticServer();
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
      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

      // Wait for the element to be present
      await page.waitForSelector('my-component', { timeout: 20000 });

      // Wait until shadowRoot exists (hydration complete)
      await page.waitForFunction(
        () => {
          const el = document.querySelector('my-component');
          return !!el && !!(el as any).shadowRoot && !!(el as any).shadowRoot.textContent && (el as any).shadowRoot.textContent.trim().length > 0;
        },
        { timeout: 20000 },
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

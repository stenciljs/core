import puppeteer, { Browser } from 'puppeteer';
import { createServer, Server } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 8765;
const DIST_DIR = join(__dirname, 'dist');

// Simple static file server for serving Vite-built files
function startStaticServer(): Promise<Server> {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };

  const server = createServer((req, res) => {
    let filePath = join(DIST_DIR, req.url === '/' ? 'index.html' : req.url!);

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

      // Wait for the component to be defined and hydrated
      await page.waitForSelector('my-component.hydrated', { timeout: 5000 });

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

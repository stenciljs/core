import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { extname, join } from 'node:path';
import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

// @ts-ignore may not be existing when project hasn't been built
type HydrateModule = typeof import('../dist/ssr/index.js');
let renderToString: HydrateModule['renderToString'];

const WWW = join(import.meta.dirname, '..', 'www');
const MIME: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css' };

type Loader = 'lazy' | 'standalone';

interface Streamed {
  /** markup chunks; the server waits `delay` ms between each */
  chunks: string[];
  /** top-level tags; the body is held until they're defined */
  tags: string[];
  loader: Loader;
}

const loaderScript = ({ loader, tags }: Streamed) =>
  loader === 'lazy'
    ? `<script type="module" async src="/build/ssrtests.esm.js"></script>`
    : `<script type="module" async>` +
      tags
        .map(
          (t, i) => `import { defineCustomElement as d${i} } from '/standalone/${t}.js'; d${i}();`,
        )
        .join('') +
      `</script>`;

/**
 * Serves `www/` plus a page that's streamed in chunks.
 * Components are defined `async` (and so upgrade synchronously) while the parser
 * is still mid-document - the same ordering as streaming SSR frameworks.
 */
const startServer = (page: Streamed, delay = 150) => {
  let go: () => void;
  const defined = new Promise<void>((r) => (go = r));

  const server = createServer(async (req, res) => {
    const url = req.url ?? '/';
    if (url === '/go') {
      go();
      res.end();
      return;
    }
    if (url === '/') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.write(
        `<!doctype html><html><head>` +
          loaderScript(page) +
          `<script>Promise.all(${JSON.stringify(page.tags)}.map((t) => customElements.whenDefined(t))).then(() => fetch('/go'))</script>` +
          `</head><body>`,
      );
      await defined;
      for (const chunk of page.chunks) {
        res.write(chunk);
        await new Promise((r) => setTimeout(r, delay));
      }
      res.end('</body></html>');
      return;
    }
    try {
      const body = await readFile(join(WWW, url.split('?')[0]));
      res.writeHead(200, { 'content-type': MIME[extname(url)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });

  return new Promise<{ server: Server; url: string }>((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ server, url: `http://localhost:${port}/` });
    });
  });
};

/** split `html` immediately before each of `markers` (in order) */
const splitBefore = (html: string, markers: string[]) => {
  const chunks: string[] = [];
  let rest = html;
  for (const marker of markers) {
    const i = rest.indexOf(marker);
    expect(i, `marker "${marker}" not found`).toBeGreaterThan(-1);
    chunks.push(rest.slice(0, i));
    rest = rest.slice(i);
  }
  chunks.push(rest);
  return chunks;
};

for (const loader of ['lazy', 'standalone'] as const) {
  test.describe(`streaming SSR (${loader})`, () => {
    let server: Server | undefined;

    test.beforeEach(async () => {
      // @ts-ignore may not be existing when project hasn't been built
      const mod = await import('../dist/ssr/index.js');
      renderToString = mod.renderToString;
      mod.resetSsrDocData();
    });

    test.afterEach(() => {
      server?.close();
      server = undefined;
    });

    test('keeps the declarative shadow root when the host is defined before its template is parsed', async ({
      page,
    }) => {
      const { html } = await renderToString('<cmp-dsd initial-counter="5"></cmp-dsd>', {
        serializeShadowRoot: 'declarative-shadow-dom',
        fullDocument: false,
      });
      const started = await startServer({
        tags: ['cmp-dsd'],
        loader,
        chunks: splitBefore(html!, ['<template shadowrootmode']),
      });
      server = started.server;

      const messages: string[] = [];
      page.on('console', (m) => messages.push(m.text()));
      page.on('pageerror', (e) => messages.push(e.message));

      await page.goto(started.url);
      const button = page.locator('cmp-dsd').locator('button');
      await expect(button).toHaveText('Count me: 5!');

      expect(messages.filter((m) => /declarative shadow root/i.test(m))).toEqual([]);
      // a rejected DSD template is left behind as a light DOM <template>
      expect(await page.locator('cmp-dsd > template').count()).toBe(0);
      expect(
        await page
          .locator('cmp-dsd')
          .evaluate((el) => el.shadowRoot!.querySelectorAll('button').length),
      ).toBe(1);

      await button.click();
      await expect(button).toHaveText('Count me: 6!');
    });

    for (const serializeShadowRoot of ['declarative-shadow-dom', 'scoped'] as const) {
      test(`nested shadow / scoped components hydrate the same as a buffered page (${serializeShadowRoot})`, async ({
        page,
      }) => {
        const markup = `
        <shadow-ssr-parent-cmp>
          <p slot="things">things</p>
          <p>default</p>
        </shadow-ssr-parent-cmp>
        <scoped-ssr-parent-cmp>
          <p>scoped default</p>
          <p slot="things">scoped things</p>
        </scoped-ssr-parent-cmp>`;
        const { html } = await renderToString(markup, {
          serializeShadowRoot,
          fullDocument: false,
        });

        // buffered reference
        const tags = ['shadow-ssr-parent-cmp', 'scoped-ssr-parent-cmp'];
        const buffered = await startServer({ tags, loader, chunks: [html!] });
        await page.goto(buffered.url);
        await page.waitForFunction(() =>
          [...document.querySelectorAll('shadow-ssr-parent-cmp, scoped-ssr-parent-cmp')].every(
            (el) => el.hasAttribute('custom-hydrate-flag'),
          ),
        );
        const expected = await page.evaluate(() => document.body.innerText);
        buffered.server.close();

        // break the stream inside every host so each one connects before its children exist
        const hostStarts = [...html!.matchAll(/<([a-z]+-[a-z-]+)[^>]*\ss-id=/g)].map((m) => m[0]);
        const started = await startServer({
          tags,
          loader,
          chunks: splitBefore(html!, hostStarts).flatMap((c) => {
            // split again just after each host start tag
            const end = c.indexOf('>');
            return c.startsWith('<') && end > -1 ? [c.slice(0, end + 1), c.slice(end + 1)] : [c];
          }),
        });
        server = started.server;

        const messages: string[] = [];
        page.on('console', (m) => messages.push(m.text()));
        page.on('pageerror', (e) => messages.push(e.message));

        await page.goto(started.url);
        await page.waitForFunction(() =>
          [...document.querySelectorAll('shadow-ssr-parent-cmp, scoped-ssr-parent-cmp')].every(
            (el) => el.hasAttribute('custom-hydrate-flag'),
          ),
        );
        expect(await page.evaluate(() => document.body.innerText)).toBe(expected);
        expect(messages.filter((m) => /declarative shadow root|error/i.test(m))).toEqual([]);
      });
    }
  });
}

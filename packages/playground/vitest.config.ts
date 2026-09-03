// Requires `pnpm build` in packages/playground before first run.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

import type { IncomingMessage, ServerResponse } from 'node:http';

// Minimal shape of what we need from a Vite dev-server plugin - not worth a `vite` devDependency.
interface DevServerPlugin {
  name: string;
  configureServer(server: {
    config: { root: string };
    middlewares: {
      use(fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void): void;
    };
  }): void;
}

// Vite's dev server transforms every `.js` as ESM, which breaks Monaco's classic (non-module) TS
// worker (see monaco-setup.ts) once it actually loads through it. Real static hosts never do this
// transform, so serve worker requests (tagged `Sec-Fetch-Dest: worker`) raw instead.
const serveWorkerScriptsRaw: DevServerPlugin = {
  name: 'serve-worker-scripts-raw',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.headers['sec-fetch-dest'] !== 'worker' || !req.url) return next();
      const filePath = join(server.config.root, req.url.split('?')[0]!);
      res.setHeader('Content-Type', 'text/javascript');
      res.end(readFileSync(filePath));
    });
  },
};

export default defineConfig({
  plugins: [serveWorkerScriptsRaw],
  // Matches how a real static host must serve dist/vendor/* - module scripts
  // loaded from inside the sandboxed preview iframe's opaque origin require
  // CORS headers on the resource, same as any cross-origin ESM import.
  // Verified: test fails without this (ok: false), not just theoretical.
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    include: ['test/browser.spec.ts'],
  },
});

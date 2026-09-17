# @stencil/dev-server

Development server for Stencil with DOM-based Hot Module Replacement (HMR).

## Install

```bash
npm install --save-dev @stencil/dev-server @stencil/core
```

## Usage

The dev server is configured via `stencil.config.ts` and started automatically with `stencil build --dev --watch --serve`.

```ts
// stencil.config.ts
import { Config } from '@stencil/core';

export const config: Config = {
  devServer: {
    port: 3333,
    openBrowser: true,
    reloadStrategy: 'pageReload', // or 'hmr'
  },
  outputTargets: [{ type: 'www' }],
};
```

```bash
npx stencil build --dev --watch --serve
```

## Programmatic API

### `start(config, logger, watcher?)` — start the dev server

```ts
import { start } from '@stencil/dev-server';
import { createNodeLogger } from '@stencil/core/sys/node';

const server = await start(
  {
    root: './www',       // directory to serve
    port: 3333,
    openBrowser: true,
    reloadStrategy: 'hmr', // 'hmr' | 'pageReload' | null
  },
  createNodeLogger(),
);

console.log(`Listening at ${server.browserUrl}`);

// Shut down when done
await server.close();
```

### With a Stencil compiler watcher (full HMR)

Pass a `CompilerWatcher` to connect build output to the dev server — file changes trigger HMR or a page reload automatically.

```ts
import * as coreCompiler from '@stencil/core/compiler';
import { start } from '@stencil/dev-server';
import { createNodeLogger, createNodeSys } from '@stencil/core/sys/node';

const logger = createNodeLogger();
const sys = createNodeSys();

const { config } = await coreCompiler.loadConfig({
  configPath: './stencil.config.ts',
  logger,
  sys,
});

const compiler = await coreCompiler.createCompiler(config);
const watcher = await compiler.createWatcher();

const server = await start(
  { root: './www', port: 3333, reloadStrategy: 'hmr' },
  logger,
  watcher,
);

// Start watching — builds trigger HMR updates in the browser
await watcher.start();

// To shut down:
// await watcher.close();
// await server.close();
```

The returned `DevServer` exposes `address`, `browserUrl`, `protocol`, `port`, `root`, and `close()`.

#### Key config options

| Option | Default | Description |
|---|---|---|
| `root` | `'.'` | Directory to serve files from |
| `port` | `3333` | Port to listen on |
| `address` | `'0.0.0.0'` | Network interface to bind |
| `reloadStrategy` | `'hmr'` | `'hmr'`, `'pageReload'`, or `null` to disable |
| `openBrowser` | `false` | Open browser on start |
| `https` | — | `{ cert, key }` to enable HTTPS |
| `worker` | `true` | Fork server into a child process (disable for debugging) |
| `ssr` | `false` | Server-side render each page on request (dev only - you must have a `ssr` output target setup) |

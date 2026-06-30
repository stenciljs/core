# @stencil/cli

CLI for [Stencil](https://stenciljs.com) — build, test, and generate web components.

## Install

```bash
npm install --save-dev @stencil/cli @stencil/core
```

## Usage

```bash
# Build
npx stencil build

# Build in watch mode
npx stencil build --watch

# Run tests
npx stencil test --spec
npx stencil test --e2e

# Generate a new component
npx stencil generate my-component

# Start dev server
npx stencil build --dev --watch --serve
```

## Programmatic API

### `run(init)` — invoke the CLI from code

Mirrors running `stencil <task>` in the terminal. Parse your own `args` array and Stencil handles the rest.

```ts
import { run } from '@stencil/cli';
import { createNodeLogger, createNodeSys } from '@stencil/core/sys/node';

await run({
  args: ['build', '--dev', '--watch'],
  logger: createNodeLogger(),
  sys: createNodeSys(),
});
```

### `runTask(coreCompiler, config, task, sys, flags?)` — lower-level task execution

Use this when you need control over the compiler instance or config before running a task. You are responsible for loading the compiler and config yourself.

```ts
import * as coreCompiler from '@stencil/core/compiler';
import { runTask, createConfigFlags } from '@stencil/cli';
import { createNodeLogger, createNodeSys } from '@stencil/core/sys/node';

const logger = createNodeLogger();
const sys = createNodeSys();

// Load and validate stencil.config.ts
const { config, diagnostics } = await coreCompiler.loadConfig({
  configPath: './stencil.config.ts',
  logger,
  sys,
});
if (diagnostics.length) logger.printDiagnostics(diagnostics);

// Optional: override config flags (e.g. force dev mode)
const flags = createConfigFlags({ task: 'build', dev: true });

await runTask(coreCompiler, config, 'build', sys, flags);
```

Valid `task` values: `'build'` | `'docs'` | `'generate'` | `'serve'` | `'prerender'` | `'test'` | `'info'` | `'migrate'` | `'init'` | `'add'` | `'telemetry'`

`flags` is optional — if omitted, defaults are derived from the task.

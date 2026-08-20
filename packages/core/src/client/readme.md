# client

Browser-specific platform implementation for Stencil's runtime.

## Overview

This directory provides the browser platform layer that connects the platform-agnostic `runtime/` to browser APIs. It implements the `@platform` interface with browser-specific behavior.

## Key Files

| File                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `client-host-ref.ts`    | Maps host elements to their internal state (`HostRef`) |
| `client-load-module.ts` | Lazy-loads component modules on demand                 |
| `client-style.ts`       | Attaches component styles to the DOM                   |
| `client-task-queue.ts`  | Schedules DOM updates using `requestAnimationFrame`    |
| `client-window.ts`      | Provides `window`, `document`, and other globals       |
| `client-build.ts`       | Provides the `Build` object with runtime feature flags |

## Architecture

```
┌─────────────────────────────────────────────┐
│              Component Code                 │
├─────────────────────────────────────────────┤
│     runtime/ (platform-agnostic core)       │
├──────────────────┬──────────────────────────┤
│  client/         │  server/                 │
│  (browser)       │  (SSR/hydration)         │
└──────────────────┴──────────────────────────┘
```

The runtime imports from `@platform`, which resolves to either `client/` or `server/` depending on the build target.

## Exports

The `index.ts` re-exports:

- All platform implementations (`client-*.ts` files)
- `BUILD`, `Env`, `NAMESPACE` from `virtual:app-data`
- Everything from `@runtime`

This makes `@stencil/core/runtime/client` a complete bundle for browser usage.
# server

Server-side rendering (SSR) and hydration runtime.

## Overview

This directory provides the Node.js platform implementation for rendering Stencil components on the server. It's the counterpart to `client/` - both implement the `@platform` interface but for different environments.

Previously named `hydrate/`, renamed to `server/` in v5 for clarity.

## Directory Structure

| Directory   | Purpose                                            |
| ----------- | -------------------------------------------------- |
| `platform/` | Server platform implementation (mirrors `client/`) |
| `runner/`   | Hydrate script execution and orchestration         |

## Key Concepts

### Hydration

The process of:

1. Rendering components to HTML on the server
2. Serializing component state into the HTML
3. "Hydrating" on the client - attaching event listeners and state without re-rendering

### Platform Abstraction

The runtime uses `@platform` imports that resolve differently:

- Browser build → `client/`
- Server build → `server/`

This allows the same component code to run in both environments.

## Usage

The server runtime is bundled into an SSR script via the `ssr` output target (formerly `dist-hydrate-script`):

```ts
import { renderToString } from './dist/ssr';

const result = await renderToString('<my-component></my-component>');
console.log(result.html);
```

## Public API

Exported from `server/runner/index.ts`, exposed via `@stencil/core/runtime/server`:

- `renderToString()` - render to an HTML string
- `streamToString()` - render to a web-standard `ReadableStream<string>` (works in Node 22+, Cloudflare Workers, Deno, Bun, and other WinterCG runtimes)
- `hydrateDocument()` / `ssrDocument()` - hydrate/render against a mock document
- `serializeDocumentToString()` - serialize a mock DOM to an HTML string
- `createWindowFromHtml()` - build a mock window from existing HTML
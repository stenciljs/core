# @stencil/dev-server

Development server with hot module replacement (HMR). Runs as a separate worker thread from the main compiler process.

## Architecture

- `server/` - Node.js HTTP + WebSocket server, spawned via `worker-thread.js`/`worker-main.ts` so it survives compiler restarts
- `client/` - browser-side script injected into served pages; opens the WebSocket, applies HMR updates, renders the error overlay

The compiler's watch task talks to the server process over the worker thread interface (`server/context.ts`), pushing build results which get relayed to connected browsers via `server/handlers.ts` → `client/websocket.ts`.

## Key Files

| File                     | Purpose                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `server/server.ts`       | HTTP server setup                                                |
| `server/handlers.ts`     | Request routing (static files, directory listing, component preview) |
| `server/worker-thread.js`/`worker-main.ts` | Worker thread bootstrapping                        |
| `server/dev-preview.ts`  | Per-directory component preview page (no-`www`, filesystem-driven) |
| `server/ssr.ts`          | Dev-time SSR preview                                             |
| `server/editor.ts` / `open-in-editor.d.ts` | "open in editor" support for error overlay stack frames |
| `client/websocket.ts`    | Client-side WS connection + reconnect handling                  |
| `client/hmr/`            | HMR update application (styles, components)                     |
| `client/error.ts` / `error.css` | Build-error overlay                                       |

## Filesystem-Driven Preview

For projects without a `www` output target, the dev server serves component previews directly from the source directory - a directory containing `.tsx` files with no `.html` file gets an auto-generated preview page (`server/dev-preview.ts`) listing just the components in that directory. This is unrelated to any config flag; it applies to any non-`www` project.

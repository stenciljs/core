# @stencil/mock-doc

Lightweight, dependency-free DOM implementation used for server-side rendering and testing. This is what makes SSR fast: it's a much smaller, simpler `document`/`window` than a full browser DOM or JSDOM.

## Overview

Implements just enough of the DOM API for Stencil components to render and hydrate: `Document`, `Window`, `Element`/`HTMLElement`, `Node`, events, `CustomElementRegistry`, `CSSStyleSheet`, HTML parsing/serialization, and a handful of browser globals (`localStorage`, `history`, `IntersectionObserver`/`ResizeObserver` stubs, etc).

Used by:
- `@stencil/core/runtime/server` (SSR/hydration) - one mock `window` per render, so rendering many pages in the same process never leaks global state between them
- `@stencil/core/testing`'s `newSpecPage` - unit tests get a real (mock) DOM without a browser

## Key Files

| File                       | Purpose                                      |
| --------------------------- | --------------------------------------------- |
| `window.ts`                | `MockWindow` - the root global object          |
| `document.ts`               | `MockDocument`                                 |
| `element.ts` / `node.ts`   | `MockElement`, `MockHTMLElement`, `MockNode`   |
| `custom-element-registry.ts` | `customElements` implementation              |
| `parse-html.ts` / `parser.ts` | HTML → DOM parsing                          |
| `serialize-node.ts`        | DOM → HTML string serialization                |
| `css-style-declaration.ts` / `css-style-sheet.ts` | Inline style + `<style>`/`CSSStyleSheet` handling |
| `event.ts`                 | `MockCustomEvent`, `MockKeyboardEvent`, `MockMouseEvent` |
| `global.ts`                | `setupGlobal`/`teardownGlobal`/`patchWindow` - installs mock globals onto a real Node.js `global` |

## Usage

```ts
import { createDocument, createFragment, parseHtmlToDocument } from '@stencil/mock-doc';
```

Each mock window/document is independent and disposable - no shared module-level state, which is what allows concurrent/repeated SSR renders to stay isolated.

# @stencil/mock-doc

A minimal mock DOM implementation for server-side rendering and unit testing of Stencil components.

## Install

```bash
npm install --save-dev @stencil/mock-doc
```

## Usage

### `createDocument(html?)` — lightweight document only

Use this when you only need a `Document` with no surrounding `window` object:

```ts
import { createDocument, serializeNodeToHtml } from '@stencil/mock-doc';

const doc = createDocument('<div class="greeting">Hello</div>');
const el = doc.querySelector('.greeting');
el.textContent = 'Hello, world!';

console.log(serializeNodeToHtml(el, { outerHtml: true }));
// <div class="greeting">Hello, world!</div>
```

### `MockWindow(html?)` — full window environment

Use this when your code accesses `window`, `location`, `navigator`, `localStorage`, etc.:

```ts
import { MockWindow, serializeNodeToHtml } from '@stencil/mock-doc';

const win = new MockWindow('<html><body><my-comp></my-comp></body></html>');
const doc = win.document;

const el = doc.querySelector('my-comp');
el.setAttribute('label', 'Hello');

const html = serializeNodeToHtml(doc);
```

### `parseHtmlToDocument` / `parseHtmlToFragment`

Parse an HTML string into a `Document` or a `DocumentFragment`:

```ts
import { parseHtmlToDocument, parseHtmlToFragment } from '@stencil/mock-doc';

const doc = parseHtmlToDocument('<p>Hello</p>');
const frag = parseHtmlToFragment('<li>one</li><li>two</li>');
```

### `serializeNodeToHtml(node, options?)`

Serialize any node back to an HTML string. Useful for snapshot tests and SSR output.

```ts
import { serializeNodeToHtml } from '@stencil/mock-doc';

// Pretty-printed output
const pretty = serializeNodeToHtml(doc, { prettyHtml: true });

// Outer HTML of a single element (includes the element's own tag)
const outer = serializeNodeToHtml(el, { outerHtml: true });

// Serialize shadow roots as Declarative Shadow DOM
const dsd = serializeNodeToHtml(doc, {
  serializeShadowRoot: 'declarative-shadow-dom',
});
```

Key options:

| Option | Default | Description |
|---|---|---|
| `prettyHtml` | `false` | Indent and add newlines |
| `indentSpaces` | `2` (when pretty) | Spaces per indent level |
| `outerHtml` | `false` | Include the root element's own tag |
| `removeEmptyAttributes` | `true` | Strip attributes with empty string values |
| `removeHtmlComments` | `false` | Strip HTML comments |
| `serializeShadowRoot` | — | `'declarative-shadow-dom'` or `'scoped'` |
| `fullDocument` | `false` | Always emit a full `<!DOCTYPE html>` document |

### `setupGlobal` / `teardownGlobal` — test framework integration

Installs a `MockWindow` onto `global` so that `window`, `document`, `customElements`, etc. are available without a browser. Call in `beforeEach`/`afterEach` to get a fresh environment per test:

```ts
import { setupGlobal, teardownGlobal } from '@stencil/mock-doc';

beforeEach(() => setupGlobal(global));
afterEach(() => teardownGlobal(global));

it('reads document.title', () => {
  document.title = 'My Page';
  expect(document.title).toBe('My Page');
});
```

`setupGlobal` returns the `MockWindow` it created, which you can use to reach `window`-level APIs directly if needed.

### `patchWindow(win)` — fill gaps in a partial window

Useful when running in an environment that has _some_ browser globals but is missing others (e.g. a custom SSR runtime):

```ts
import { patchWindow } from '@stencil/mock-doc';

patchWindow(globalThis); // fills in any missing window APIs with mock implementations
```

### Fetch mocks

Use `MockRequest`, `MockResponse`, and `MockHeaders` to test code that calls `fetch` without hitting the network:

```ts
import { MockRequest, MockResponse, MockHeaders } from '@stencil/mock-doc';

// Simulate an incoming request
const req = new MockRequest('/api/data', { method: 'POST' });
console.log(req.method); // 'POST'
console.log(req.url);    // 'http://localhost/api/data'

// Build a response your handler returns
const res = new MockResponse(JSON.stringify({ ok: true }), {
  status: 200,
  headers: new MockHeaders({ 'content-type': 'application/json' }),
});

const body = await res.json(); // { ok: true }
```

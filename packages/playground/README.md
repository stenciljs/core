# @stencil/playground

In-browser live playground for writing and previewing Stencil components.
No server-side compile step, components are transpiled and rendered entirely in the browser via `@stencil/core/compiler/browser`.

## Usage

Use the loader (registers `<stencil-playground>` as a custom element), then set its `files` property:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@stencil/playground@latest/dist/loader-bundle/stencil-playground/stencil-playground.js"></script>

<stencil-playground></stencil-playground>
<script>
  document.querySelector('stencil-playground').files = [
    {
      name: 'my-component.tsx',
      content: `import { Component } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
    },
  ];
</script>
```

 Alternatively, to install locally, `npm install @stencil/playground` and
 
 ```js
 // e.g. index.js
 import { defineCustomElements } from '@stencil/playground';
 defineCustomElements();
 ```

Each file in `files` is `{ name: string; content: string }`. `.tsx`/`.ts` files are transpiled with the real Stencil compiler and rendered live in a sand boxed preview iframe; edits are recompiled on-the-fly.

### Special file names

| Name | Purpose |
|---|---|
| `index.html` | Used as the preview iframe's document instead of the default auto-generated shell |
| `stencil.config.ts` | A subset of `Config` is read: `tsCompilerOptions`, `signalBacking`, `globalScript`, `globalStyle`, and `global-style` output targets and more |
| `global.css` / `global.ts` / `global.js` | Picked up automatically by convention if not set via config, matching the real compiler |

### Cross-file imports

Playground files can import each other by relative specifier `./my-component` and `styleUrl`s. See the component's [usage examples](./src/components/stencil-playground/usage/index.md).

## Development

```bash
pnpm start          # dev build with watch + serve
pnpm build           # production build
pnpm test:browser    # Playwright-driven browser tests
```

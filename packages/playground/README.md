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

### Layout

By default (`layout="auto"`) the editor and preview sit side by side, and stack once the playground is narrower than 640px. Set `layout="stacked"` to always put the preview under the editor. When stacked, the editor grows to fit its code, so short examples stay short.

```html
<stencil-playground layout="stacked" style="--stencil-playground-preview-height: 120px"></stencil-playground>
```

| CSS custom property | Applies to | Default |
|---|---|---|
| `--stencil-playground-height` | Side by side: minimum height | `400px` |
| `--stencil-playground-columns` | Side by side: `grid-template-columns` (editor, preview) | `minmax(320px, 1fr) minmax(320px, 1fr)` |
| `--stencil-playground-editor-height` | Stacked: editor height | fits the active file |
| `--stencil-playground-editor-max-height` | Stacked: tallest a fitted editor grows | `480px` |
| `--stencil-playground-preview-height` | Stacked: preview height | `200px` |

### Theming

The editor uses Monaco's `vs-dark` theme by default. To restyle it, set `editorTheme` to a [Monaco theme](https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneThemeData.html) (`base`, `inherit`, `rules`, `colors`). Monaco has one theme per page, so the last playground to set one wins.

```js
playground.editorTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [{ token: 'keyword', foreground: '569CD6' }],
  colors: { 'editor.background': '#0a1220' },
};
```

Style the frame (`border`, `border-radius`, `box-shadow`) on the `stencil-playground` element itself, and the rest with these custom properties:

| CSS custom property | Default |
|---|---|
| `--stencil-playground-background` (behind the editor while it loads) | `#1e1e1e` |
| `--stencil-playground-divider-color` (between editor and preview, and under the tabs) | `#333` |
| `--stencil-playground-tabs-background` | `#252526` |
| `--stencil-playground-tab-color` / `--stencil-playground-tab-active-color` | `#969696` / `#d4d4d4` |
| `--stencil-playground-tab-active-background` | `#1e1e1e` |
| `--stencil-playground-tab-divider-color` (between tabs) | `--stencil-playground-divider-color` |
| `--stencil-playground-tab-font` (`font` shorthand) | `0.8rem` monospace |
| `--stencil-playground-editor-font-family` | Monaco's |
| `--stencil-playground-editor-font-size` (px) | `13px` |
| `--stencil-playground-editor-line-height` (px, or a multiple of the font size below 8) | Monaco's |
| `--stencil-playground-editor-padding` (above the first and below the last line, px) | `0` |
| `--stencil-playground-preview-background` | `#fff` |

The editor reads its font and padding properties when it's created.

### Cross-file imports

Playground files can import each other by relative specifier `./my-component` and `styleUrl`s. See the component's [usage examples](./src/components/stencil-playground/usage/index.md).

## Development

```bash
pnpm start          # dev build with watch + serve
pnpm build           # production build
pnpm test:browser    # Playwright-driven browser tests
```

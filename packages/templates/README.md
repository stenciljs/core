# @stencil/templates

Boilerplate generators and project templates for Stencil — used internally by `stencil generate` and `stencil init`.

## Install

```bash
npm install --save-dev @stencil/templates
```

## API

### `getComponentBoilerplate(tagName, styleExtension?)` — component TSX

Generates the `.tsx` file content for a new Stencil component:

```ts
import { getComponentBoilerplate } from '@stencil/templates';

// With a stylesheet
const tsx = getComponentBoilerplate('my-button', 'css');

// Without (no styleUrl in @Component decorator)
const bare = getComponentBoilerplate('my-button');
```

`styleExtension` accepts `'css'`, `'scss'`, `'sass'`, or `'less'`.

Output for `getComponentBoilerplate('my-button', 'css')`:

```tsx
import { Component, Host } from '@stencil/core';

@Component({
  tag: 'my-button',
  styleUrl: 'my-button.css',
  encapsulation: { type: 'shadow' },
})
export class MyButton {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
```

---

### `getStyleBoilerplate(ext)` — stylesheet

Generates the initial stylesheet content. Pass the file extension — not the tag name:

```ts
import { getStyleBoilerplate } from '@stencil/templates';

const css  = getStyleBoilerplate('css');   // :host {\n  display: block;\n}
const scss = getStyleBoilerplate('scss');  // same, brace syntax
const sass = getStyleBoilerplate('sass'); // :host\n  display: block  (indented syntax)
```

---

### `toPascalCase(str)` — tag name to class name

Converts a dash-case tag name to a PascalCase class name:

```ts
import { toPascalCase } from '@stencil/templates';

toPascalCase('my-button');       // 'MyButton'
toPascalCase('ui-card-header');  // 'UiCardHeader'
```

---

### `generateStencilConfig(selections)` — `stencil.config.ts` source

Generates the content for a `stencil.config.ts` file based on wizard selections. Returns `null` when the default zero-config covers everything (loader-bundle only, no signals, no docs):

```ts
import { generateStencilConfig } from '@stencil/templates';
import type { ConfigSelections } from '@stencil/templates';

const sel: ConfigSelections = {
  namespace: 'MyLib',
  outputs: ['loader', 'standalone'],
  signals: false,
  docs: ['cem'],
};

const src = generateStencilConfig(sel);
// null if only loader + no signals + no docs (zero-config case)
// otherwise: TypeScript source string ready to write to stencil.config.ts
```

**`ConfigSelections` shape:**

| Field | Type | Description |
|---|---|---|
| `namespace` | `string` | Component library namespace (e.g. `'MyLib'`) |
| `outputs` | `OutputKey[]` | Output targets to enable |
| `signals` | `boolean` | Enable `signalBacking: true` |
| `docs` | `DocKey[]` | Documentation targets to include |

**`OutputKey` values:** `'loader'` \| `'standalone'` \| `'ssr'` \| `'ssr-wasm'` \| `'www'`

**`DocKey` values:** `'cem'` \| `'json'` \| `'vscode'`

---

### `generatePackageJsonFields(outputs)` — `package.json` distributable fields

Returns the `module`, `types`, and `type` fields to merge into `package.json` for a given set of output targets. Returns an empty object for `'www'`-only (non-publishable app mode):

```ts
import { generatePackageJsonFields } from '@stencil/templates';

generatePackageJsonFields([]);             // loader-bundle (default)
// { type: 'module', module: './dist/loader-bundle/index.js', types: './dist/types/loader.d.ts' }

generatePackageJsonFields(['standalone']);
// { type: 'module', module: './dist/standalone/index.js', types: './dist/types/standalone.d.ts' }

generatePackageJsonFields(['www']);
// {}  — www is an app, not a publishable package
```

Priority when multiple outputs are selected: `loader` > `standalone` > `ssr` > `ssr-wasm`.

---

### `getTemplatePath(templateId)` — project template directory

Returns the absolute path to a project template directory, ready to copy into a new project:

```ts
import { getTemplatePath, PROJECT_TEMPLATES } from '@stencil/templates';

// Currently: ['component-starter']
console.log(PROJECT_TEMPLATES);

const dir = getTemplatePath('component-starter');
// → /absolute/path/to/@stencil/templates/templates/project/component-starter
```

The `component-starter` template includes a `stencil.config.ts`, `tsconfig.json`, `package.json`, `.gitignore`, a sample component, and a utility file.

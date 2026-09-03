import { describe, expect, it } from 'vitest';

import { defineCustomElements } from '../dist/loader-bundle/loader/index.js';
import type { PlaygroundFile } from '../src/utils';
await defineCustomElements();

const EVENT_TIMEOUT = 20000;

const waitForPreviewResult = (el: HTMLElement) =>
  new Promise<{ ok: boolean; message?: string }>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('timed out waiting for previewResult')),
      EVENT_TIMEOUT,
    );
    el.addEventListener('previewResult', ((ev: CustomEvent) => {
      clearTimeout(timer);
      resolve(ev.detail);
    }) as EventListener);
  });

const waitForEditorReady = (el: HTMLElement) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('timed out waiting for editorReady')),
      EVENT_TIMEOUT,
    );
    el.addEventListener(
      'editorReady',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

const mount = async (files?: PlaygroundFile[]) => {
  const el = document.createElement('stencil-playground');
  if (files) (el as HTMLElement & { files: PlaygroundFile[] }).files = files;
  document.body.appendChild(el);
  try {
    return await waitForPreviewResult(el);
  } finally {
    el.remove(); // remove even on timeout, or its editor keeps loading in the background
  }
};

describe('stencil-playground', () => {
  it('compiles user-typed source and renders it in the sandboxed preview iframe', async () => {
    const result = await mount();
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('resolves an import between two project files and auto-mounts every component found', async () => {
    const result = await mount([
      {
        name: 'greeting.ts',
        content: `export const greeting = 'Hello from a sibling module!';`,
      },
      {
        name: 'my-component.tsx',
        content: `import { Component, h } from '@stencil/core';
import { greeting } from './greeting';

@Component({ tag: 'my-component' })
export class MyComponent {
  render() {
    return <div>{greeting}</div>;
  }
}
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('uses a supplied index.html as the preview template', async () => {
    const result = await mount([
      {
        name: 'my-component.tsx',
        content: `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
      },
      {
        name: 'index.html',
        content: `<script type="module" src="./my-component.tsx"></script>
<my-component></my-component>
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('resolves an index.html script src referencing the compiled .js name against its .tsx source', async () => {
    const result = await mount([
      {
        name: 'my-component.tsx',
        content: `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
      },
      {
        name: 'index.html',
        content: `<script type="module" src="./my-component.js"></script>
<my-component></my-component>
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('executes a supplied stencil.config.ts and applies its tsCompilerOptions', async () => {
    const result = await mount([
      {
        name: 'my-component.tsx',
        content: `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
      },
      {
        name: 'stencil.config.ts',
        content: `import type { Config } from '@stencil/core';

export const config: Config = {
  tsCompilerOptions: { jsxImportSource: '@stencil/core' },
};
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('renders @stencil/core/signals without an explicit h import (automatic JSX runtime)', async () => {
    const result = await mount([
      {
        name: 'my-stats.tsx',
        content: `import { Component, State } from '@stencil/core';
import { computed, Effect } from '@stencil/core/signals';

@Component({ tag: 'my-stats' })
export class MyStats {
  @State() count = 0;

  doubled = computed(() => this.count * 2);

  @Effect()
  logChange() {
    console.log('count is now', this.count);
  }

  render() {
    return <div>{this.count} x 2 = {this.doubled}</div>;
  }
}
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('reflects a new `files` value set on an already-connected element', async () => {
    const el = document.createElement('stencil-playground');
    document.body.appendChild(el);
    try {
      await waitForPreviewResult(el); // initial default render

      const secondResult = waitForPreviewResult(el);
      (el as HTMLElement & { files: PlaygroundFile[] }).files = [
        {
          name: 'my-other-component.tsx',
          content: `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-other-component' })
export class MyOtherComponent {
  render() {
    return <div>A different component!</div>;
  }
}
`,
        },
      ];
      const result = await secondResult;
      expect(result).toEqual({ ok: true, message: undefined });
    } finally {
      el.remove(); // remove even on failure, or its editor keeps loading in the background
    }
  }, 30000);

  it('accepts a `files` value containing only a stencil.config.ts, set right after connecting', async () => {
    // Regression test: used to throw "Failed to resolve module specifier '@stencil/core/app-data'".
    const el = document.createElement('stencil-playground');
    try {
      document.body.appendChild(el);
      // `componentOnReady()`, not the `editorReady` event: the event fires from inside the child
      // editor's own componentDidLoad, which can resolve one tick before Stencil actually marks
      // this element's own @Watch('files') as armed (that happens after ITS componentDidLoad,
      // which itself waits on the child's). Setting `.files` between those two points is a real
      // race - the watch silently no-ops for that change since it isn't "watch ready" yet.
      await (el as unknown as { componentOnReady(): Promise<unknown> }).componentOnReady();

      const secondReady = waitForEditorReady(el);
      (el as HTMLElement & { files: PlaygroundFile[] }).files = [
        {
          name: 'stencil.config.ts',
          content: `import type { Config } from '@stencil/core';\n\nexport const config: Config = {\n  signalBacking: true,\n};\n`,
        },
      ];
      await secondReady;
      // Model creation is synchronous, but Monaco's own rendering of that model into `.view-lines`
      // happens on a later animation frame.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const editorEl = el.shadowRoot!.querySelector('stencil-playground-editor')!;
      const viewLines = editorEl.shadowRoot!.querySelector('.view-lines');
      expect(viewLines?.textContent ?? '').toContain('signalBacking');
    } finally {
      el.remove(); // remove even on failure, or its editor keeps loading in the background
    }
  }, 30000);

  it('resolves a Mixin(...) ancestor across files instead of crashing on ts.sys resolution', async () => {
    // Regression test: without a `resolveImport` callback, class-extension resolution falls back
    // to the compiler's real TS-module-resolution path, which throws "Cannot read properties of
    // undefined (reading 'directoryExists')" in a browser bundle (`ts.sys` is a no-op there).
    const result = await mount([
      {
        name: 'countable.ts',
        content: `import { State } from '@stencil/core';

export const Countable = (Base) => {
  class CountableClass extends Base {
    @State() count = 0;

    increment() {
      this.count++;
    }
  }
  return CountableClass;
};
`,
      },
      {
        name: 'my-counter.tsx',
        content: `import { Component, Mixin, h } from '@stencil/core';
import { Countable } from './countable';

@Component({ tag: 'my-counter' })
export class MyCounter extends Mixin(Countable) {
  render() {
    return <button onClick={() => this.increment()}>Count: {this.count}</button>;
  }
}
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('resolves a bare `@stencil/core` import that survives compilation', async () => {
    // Regression test: `@Component` is always elided by the static transform, and an *invoked*
    // `Mixin(...)` is rewritten away, but a real runtime symbol like `Host` (or a merely
    // imported-and-unused `Mixin`) survives as a literal `from '@stencil/core'` in the compiled
    // output - used to throw "Failed to resolve module specifier '@stencil/core'".
    const result = await mount([
      {
        name: 'my-component.tsx',
        content: `import { Component, Host, Mixin, h } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  render() {
    return <Host class="wrapped"><div>Hello from Stencil!</div></Host>;
  }
}
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('resolves @import "stencil-globals"/"stencil-hydrate" in a global stylesheet', async () => {
    // Regression test: previously threw "Failed to resolve module specifier './stencil-globals'"
    // - transpileSync's CSS-to-ESM transform treated the virtual specifier as a real relative
    // import. `stencil-globals` should collect the component's `globalStyleUrl` CSS;
    // `stencil-hydrate` has nothing to produce in a live preview (no SSR/hydration boundary), so
    // it should just resolve to nothing rather than crash.
    const result = await mount([
      {
        name: 'my-component.tsx',
        content: `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-component', globalStyleUrl: './my-component.global.css' })
export class MyComponent {
  componentDidLoad() {
    const css = Array.from(document.adoptedStyleSheets)
      .flatMap((sheet) => Array.from(sheet.cssRules))
      .map((r) => r.cssText)
      .join('\\n');
    if (!css.includes('component-global-style-marker')) {
      throw new Error('the component globalStyleUrl was not collected into stencil-globals');
    }
  }
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
      },
      {
        name: 'my-component.global.css',
        content: `.component-global-style-marker { color: blue; }`,
      },
      {
        name: 'global.css',
        content: `
@import "stencil-globals";
@import "stencil-hydrate";
.global-style-marker { color: red; }
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('auto-detects global.css/global.ts by convention with no stencil.config.ts at all', async () => {
    const result = await mount([
      {
        name: 'my-component.tsx',
        content: `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  componentDidLoad() {
    if ((window as any).globalScriptRan !== true) {
      throw new Error('global script did not run before the component mounted');
    }
    const injected = Array.from(document.adoptedStyleSheets).some((sheet) =>
      Array.from(sheet.cssRules).some((r) => r.cssText.includes('playground-global-style-marker')),
    );
    if (!injected) {
      throw new Error('global style was not injected');
    }
  }
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
      },
      {
        name: 'global.ts',
        content: `export default () => {
  (window as any).globalScriptRan = true;
};
`,
      },
      {
        name: 'global.css',
        content: `.playground-global-style-marker { color: red; }`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('executes a configured Config.globalScript before the preview mounts', async () => {
    // The preview iframe is sandboxed with `allow-scripts` only (opaque origin), so its
    // document is cross-origin from this test - verified from inside the iframe instead, via the
    // same throw -> setErrorHandler -> previewResult path the other tests rely on.
    const result = await mount([
      {
        name: 'my-component.tsx',
        content: `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  componentDidLoad() {
    if ((window as any).globalScriptRan !== true) {
      throw new Error('global script did not run before the component mounted');
    }
  }
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
      },
      {
        name: 'global.ts',
        content: `export default () => {
  (window as any).globalScriptRan = true;
};
`,
      },
      {
        name: 'stencil.config.ts',
        content: `import type { Config } from '@stencil/core';

export const config: Config = {
  globalScript: './global.ts',
};
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('injects a configured Config.globalStyle into the preview', async () => {
    const result = await mount([
      {
        name: 'my-component.tsx',
        content: `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  componentDidLoad() {
    const injected = Array.from(document.adoptedStyleSheets).some((sheet) =>
      Array.from(sheet.cssRules).some((r) => r.cssText.includes('playground-global-style-marker')),
    );
    if (!injected) {
      throw new Error('global style was not injected');
    }
  }
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
      },
      {
        name: 'global.css',
        content: `.playground-global-style-marker { color: red; }`,
      },
      {
        name: 'stencil.config.ts',
        content: `import type { Config } from '@stencil/core';

export const config: Config = {
  globalStyle: './global.css',
};
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);

  it('compiles and injects every explicit `global-style` output target', async () => {
    const result = await mount([
      {
        name: 'my-component.tsx',
        content: `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  componentDidLoad() {
    const css = Array.from(document.adoptedStyleSheets)
      .flatMap((sheet) => Array.from(sheet.cssRules))
      .map((r) => r.cssText)
      .join('\\n');
    if (!css.includes('marker-one') || !css.includes('marker-two')) {
      throw new Error('not every global-style output target was injected');
    }
  }
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
      },
      {
        name: 'theme-a.css',
        content: `.marker-one { color: red; }`,
      },
      {
        name: 'theme-b.css',
        content: `.marker-two { color: blue; }`,
      },
      {
        name: 'stencil.config.ts',
        content: `import type { Config } from '@stencil/core';

export const config: Config = {
  outputTargets: [
    { type: 'global-style', input: './theme-a.css' },
    { type: 'global-style', input: './theme-b.css' },
  ],
};
`,
      },
    ]);
    expect(result).toEqual({ ok: true, message: undefined });
  }, 30000);
});

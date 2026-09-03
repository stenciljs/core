import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';
import type { Page } from '@playwright/test';

import type { PlaygroundFile } from '../src/utils';

interface PreviewResult {
  ok: boolean;
  message?: string;
}

const mount = async (page: Page, files?: PlaygroundFile[]): Promise<PreviewResult> => {
  const previewResult = await page.spyOnEvent('previewResult');
  await page.evaluate((mountFiles) => {
    const el = document.createElement('stencil-playground');
    if (mountFiles) (el as HTMLElement & { files: PlaygroundFile[] }).files = mountFiles;
    document.body.appendChild(el);
  }, files);
  const ev = await previewResult.next();
  return ev.detail;
};

test.beforeEach(async ({ page }) => {
  await page.goto('/test/fixture.html');
});

test.describe('stencil-playground', () => {
  test('compiles user-typed source and renders it in the sandboxed preview iframe', async ({
    page,
  }) => {
    const result = await mount(page);
    expect(result).toEqual({ ok: true, message: undefined });
  });

  test('resolves an import between two project files and auto-mounts every component found', async ({
    page,
  }) => {
    const result = await mount(page, [
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
  });

  test('uses a supplied index.html as the preview template', async ({ page }) => {
    const result = await mount(page, [
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
  });

  test('resolves an index.html script src referencing the compiled .js name against its .tsx source', async ({
    page,
  }) => {
    const result = await mount(page, [
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
  });

  test('executes a supplied stencil.config.ts and applies its tsCompilerOptions', async ({
    page,
  }) => {
    const result = await mount(page, [
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
  });

  test('renders @stencil/core/signals without an explicit h import (automatic JSX runtime)', async ({
    page,
  }) => {
    const result = await mount(page, [
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
  });

  test('reflects a new `files` value set on an already-connected element', async ({ page }) => {
    const previewResult = await page.spyOnEvent('previewResult');
    await page.evaluate(() => {
      document.body.appendChild(document.createElement('stencil-playground'));
    });
    await previewResult.next(); // initial default render

    await page.evaluate(
      (files) => {
        const el = document.querySelector('stencil-playground') as HTMLElement & {
          files: PlaygroundFile[];
        };
        el.files = files;
      },
      [
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
      ],
    );
    const ev = await previewResult.next();
    expect(ev.detail).toEqual({ ok: true, message: undefined });
  });

  test('accepts a `files` value containing only a stencil.config.ts, set right after connecting', async ({
    page,
  }) => {
    // Regression test: used to throw "Failed to resolve module specifier '@stencil/core/app-data'".
    const editorReady = await page.spyOnEvent('editorReady');
    const elHandle = await page.evaluateHandle(async () => {
      const el = document.createElement('stencil-playground');
      document.body.appendChild(el);
      // `componentOnReady()`, not the `editorReady` event: the event fires from inside the child
      // editor's own componentDidLoad, which can resolve one tick before Stencil actually marks
      // this element's own @Watch('files') as armed (that happens after ITS componentDidLoad,
      // which itself waits on the child's). Setting `.files` between those two points is a real
      // race - the watch silently no-ops for that change since it isn't "watch ready" yet.
      await (el as unknown as { componentOnReady(): Promise<unknown> }).componentOnReady();
      return el;
    });
    await editorReady.next(); // editor's initial mount, with the default files

    await page.evaluate((el) => {
      (el as HTMLElement & { files: PlaygroundFile[] }).files = [
        {
          name: 'stencil.config.ts',
          content: `import type { Config } from '@stencil/core';\n\nexport const config: Config = {\n  signalBacking: true,\n};\n`,
        },
      ];
    }, elHandle);
    await editorReady.next(); // re-mount triggered by the new `files` value

    // Model creation is synchronous, but Monaco's own rendering of that model into `.view-lines`
    // happens on a later animation frame.
    const viewLinesText = await page.evaluate(
      (el) =>
        new Promise<string>((resolve) => {
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              const editorEl = el.shadowRoot!.querySelector('stencil-playground-editor')!;
              const viewLines = editorEl.shadowRoot!.querySelector('.view-lines');
              resolve(viewLines?.textContent ?? '');
            }),
          );
        }),
      elHandle,
    );
    expect(viewLinesText).toContain('signalBacking');
  });

  test('resolves a Mixin(...) ancestor across files instead of crashing on ts.sys resolution', async ({
    page,
  }) => {
    // Regression test: without a `resolveImport` callback, class-extension resolution falls back
    // to the compiler's real TS-module-resolution path, which throws "Cannot read properties of
    // undefined (reading 'directoryExists')" in a browser bundle (`ts.sys` is a no-op there).
    const result = await mount(page, [
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
  });

  test('resolves a bare `@stencil/core` import that survives compilation', async ({ page }) => {
    // Regression test: `@Component` is always elided by the static transform, and an *invoked*
    // `Mixin(...)` is rewritten away, but a real runtime symbol like `Host` (or a merely
    // imported-and-unused `Mixin`) survives as a literal `from '@stencil/core'` in the compiled
    // output - used to throw "Failed to resolve module specifier '@stencil/core'".
    const result = await mount(page, [
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
  });

  test('resolves @import "stencil-globals"/"stencil-hydrate" in a global stylesheet', async ({
    page,
  }) => {
    // Regression test: previously threw "Failed to resolve module specifier './stencil-globals'"
    // - transpileSync's CSS-to-ESM transform treated the virtual specifier as a real relative
    // import. `stencil-globals` should collect the component's `globalStyleUrl` CSS;
    // `stencil-hydrate` has nothing to produce in a live preview (no SSR/hydration boundary), so
    // it should just resolve to nothing rather than crash.
    const result = await mount(page, [
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
  });

  test('auto-detects global.css/global.ts by convention with no stencil.config.ts at all', async ({
    page,
  }) => {
    const result = await mount(page, [
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
  });

  test('executes a configured Config.globalScript before the preview mounts', async ({ page }) => {
    // The preview iframe is sandboxed with `allow-scripts` only (opaque origin), so its
    // document is cross-origin from this test - verified from inside the iframe instead, via the
    // same throw -> setErrorHandler -> previewResult path the other tests rely on.
    const result = await mount(page, [
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
  });

  test('injects a configured Config.globalStyle into the preview', async ({ page }) => {
    const result = await mount(page, [
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
  });

  test('compiles and injects every explicit `global-style` output target', async ({ page }) => {
    const result = await mount(page, [
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
  });
});

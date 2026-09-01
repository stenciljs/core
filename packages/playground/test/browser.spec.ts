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
});

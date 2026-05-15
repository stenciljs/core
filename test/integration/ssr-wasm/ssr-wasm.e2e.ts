/**
 * End-to-end integration tests for the `ssr-wasm` output target.
 * Run `stencil build` before this suite (`pnpm test` does it automatically).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createPlugin from '@extism/extism';
import { beforeAll, describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist', 'ssr-wasm');
const jsPath = path.join(distDir, 'index.js');
const wasmPath = path.join(distDir, 'index.wasm');

describe('ssr-wasm JS bundle', () => {
  it('writes index.js to the output directory', () => {
    expect(existsSync(jsPath), `${jsPath} should exist`).toBe(true);
  });

  it('index.js contains the Extism entry points', () => {
    const code = readFileSync(jsPath, 'utf-8');
    expect(code).toContain('renderToString: async function');
    expect(code).toContain('setTagTransformer: function');
    expect(code).toContain('resetSsrDocData: function');
    expect(code).toContain('Host.inputString()');
    expect(code).toContain('Host.outputString(');
  });

  it('writes index.wasm to the output directory', () => {
    expect(existsSync(wasmPath), `${wasmPath} should exist`).toBe(true);
  });
});

describe('ssr-wasm plugin execution', () => {
  let plugin: Awaited<ReturnType<typeof createPlugin>>;

  beforeAll(async () => {
    plugin = await createPlugin(wasmPath, { useWasi: true });
  });

  const call = async (fn: string, input: unknown = '') => {
    const raw = await plugin.call(fn, typeof input === 'string' ? input : JSON.stringify(input));
    return raw ? JSON.parse(raw.text()) : null;
  };

  it('calls renderToString with default props', async () => {
    const output = await call('renderToString', { html: '<my-greeting></my-greeting>' });
    expect(output.html).toContain('<template shadowrootmode="open">');
    expect(output.html).toContain('Hello, World!');
    expect(output.html).toContain('class=');
  });

  it('calls renderToString with a name prop', async () => {
    const output = await call('renderToString', {
      html: '<my-greeting name="Stencil"></my-greeting>',
    });
    expect(output.html).toContain('<template shadowrootmode="open">');
    expect(output.html).toContain('Hello, Stencil!');
  });

  it('calls renderToString with options', async () => {
    const output = await call('renderToString', {
      html: '<my-greeting name="Stencil"></my-greeting>',
      options: {
        serializeShadowRoot: 'scoped',
      },
    });
    expect(output.html).not.toContain('<template shadowrootmode="open">');
    expect(output.html).toContain('Hello, Stencil!');
  });

  it('calls renderToString and returns full SsrResults as JSON', async () => {
    const output = await call('renderToString', {
      html: '<my-greeting name="Test"></my-greeting>',
    });
    expect(typeof output.html).toBe('string');
    expect(Array.isArray(output.diagnostics)).toBe(true);
    expect(output).toHaveProperty('components');
  });

  it('calls resetSsrDocData and works', async () => {
    await expect(plugin.call('resetSsrDocData', '')).resolves.not.toThrow();
    const output1 = await call('renderToString', {
      html: '<my-greeting name="Test"></my-greeting>',
    });
    expect(output1.html).toContain('<!--r.1-->');
    const output2 = await call('renderToString', {
      html: '<my-greeting name="Another"></my-greeting>',
    });
    expect(output2.html).toContain('<!--r.2-->');
    await expect(plugin.call('resetSsrDocData', '')).resolves.not.toThrow();
    const output3 = await call('renderToString', {
      html: '<my-greeting name="Test"></my-greeting>',
    });
    expect(output3.html).toContain('<!--r.1-->');
  });

  it('calls setTagTransformer and works', async () => {
    await call('setTagTransformer', [{ from: 'my-greeting', to: 'x-greeting' }]);

    const output = await call('renderToString', { html: '<x-greeting></x-greeting>' });
    expect(output.html).toContain('class="greeting"');
    await call('setTagTransformer', []);
  });
});

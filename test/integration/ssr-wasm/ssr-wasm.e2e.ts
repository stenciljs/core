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
        fullDocument: false,
      },
    });
    expect(output.html).not.toContain('<template shadowrootmode="open">');
    expect(output.html).not.toContain('<body');
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

  it('returns __error for input renderToString rejects (instead of html: null)', async () => {
    for (const input of [{ html: 123 }, {}]) {
      const output = await call('renderToString', input);
      expect(typeof output.__error).toBe('string');
      expect(output.__error).toContain('Invalid html');
      expect(Array.isArray(output.diagnostics)).toBe(true);
    }
  });

  it('full-document renders always start hydration ids from 1, without a reset', async () => {
    for (const name of ['Test', 'Another', 'Third']) {
      const output = await call('renderToString', {
        html: `<my-greeting name="${name}"></my-greeting>`,
      });
      expect(output.html).toContain('s-id="1"');
    }
  });

  it('fragment renders keep counting across calls until resetSsrDocData', async () => {
    const fragment = (name: string) =>
      call('renderToString', {
        html: `<my-greeting name="${name}"></my-greeting>`,
        options: { fullDocument: false },
      });
    await expect(plugin.call('resetSsrDocData', '')).resolves.not.toThrow();
    expect((await fragment('Test')).html).toContain('s-id="1"');
    expect((await fragment('Another')).html).toContain('s-id="2"');
    // a full-document render in between doesn't disturb the fragment sequence
    expect((await call('renderToString', { html: '<my-greeting></my-greeting>' })).html).toContain(
      's-id="1"',
    );
    expect((await fragment('Third')).html).toContain('s-id="3"');
    await expect(plugin.call('resetSsrDocData', '')).resolves.not.toThrow();
    expect((await fragment('Test')).html).toContain('s-id="1"');
  });

  it('calls setTagTransformer and works', async () => {
    await call('setTagTransformer', [{ from: 'my-greeting', to: 'x-greeting' }]);

    const output = await call('renderToString', { html: '<x-greeting></x-greeting>' });
    expect(output.html).toContain('class="greeting"');
    await call('setTagTransformer', []);
  });

  describe('timers (a virtual clock: nothing waits in real time)', () => {
    const render = (html: string, options?: object) =>
      call('renderToString', { html, options: { fullDocument: false, ...options } });

    it('fires setTimeout callbacks', async () => {
      const start = Date.now();
      const output = await render('<timer-cmp></timer-cmp>');
      expect(output.__error).toBeUndefined();
      expect(output.html).toContain('after timer');
      expect(Date.now() - start).toBeLessThan(2000);
    });

    it('fires setInterval callbacks until cleared', async () => {
      const output = await render('<interval-cmp></interval-cmp>');
      expect(output.__error).toBeUndefined();
      expect(output.html).toMatch(/ticks: (<!--[^>]*-->)?3/);
    });

    it('fires requestAnimationFrame callbacks', async () => {
      const output = await render('<raf-cmp></raf-cmp>');
      expect(output.__error).toBeUndefined();
      expect(output.html).toContain('after frame');
    });

    it('never fires a timer due after the timeout, and reports it', async () => {
      const start = Date.now();
      const output = await render('<slow-timer-cmp></slow-timer-cmp>');
      expect(output.__error).toContain('15000ms timeout');
      expect(Date.now() - start).toBeLessThan(2000);
    });

    it('fires a long timer when the timeout allows it', async () => {
      const output = await render('<slow-timer-cmp></slow-timer-cmp>', { timeout: 120_000 });
      expect(output.__error).toBeUndefined();
      expect(output.html).toContain('done after a minute');
    });

    it('stops a component that schedules timers forever', async () => {
      const start = Date.now();
      const output = await render('<poll-forever-cmp></poll-forever-cmp>', { timeout: 1000 });
      expect(output.__error).toContain('1000ms timeout');
      expect(Date.now() - start).toBeLessThan(5000);
    });

    it("doesn't carry timers over into the next render", async () => {
      await render('<poll-forever-cmp></poll-forever-cmp>', { timeout: 1000 });
      const output = await render('<timer-cmp></timer-cmp>');
      expect(output.__error).toBeUndefined();
      expect(output.html).toContain('after timer');
    });
  });

  // QuickJS-ng runs to completion: a component whose hydration never settles (and has no
  // timer due before the timeout) makes renderToString() resolve quickly with an error result
  // instead of hanging or silently returning no output.
  it('keeps rendering fragments after a call whose render never settled', async () => {
    // Fragment renders share one window per plugin instance (reuseWindow defaults to true here),
    // and renders sharing a window queue behind each other. A render that never settles must not
    // block every later call.
    const fragment = (html: string) =>
      call('renderToString', { html, options: { fullDocument: false } });

    const stuck = await fragment('<hangs-forever-cmp></hangs-forever-cmp>');
    expect(typeof stuck.__error).toBe('string');

    for (const name of ['After', 'Again']) {
      const output = await fragment(`<my-greeting name="${name}"></my-greeting>`);
      expect(output.__error).toBeUndefined();
      expect(output.html).toContain(`Hello, ${name}!`);
    }
  });

  it('renders fragments the same with and without window reuse', async () => {
    const html = '<my-greeting name="Same"></my-greeting>';
    await call('resetSsrDocData', '');
    const reused = await call('renderToString', { html, options: { fullDocument: false } });
    await call('resetSsrDocData', '');
    const fresh = await call('renderToString', {
      html,
      options: { fullDocument: false, reuseWindow: false },
    });
    expect(reused.html).toBe(fresh.html);
  });

  it('a component that never settles resolves with an error result instead of hanging or returning nothing', async () => {
    const start = Date.now();
    const output = await call('renderToString', {
      html: '<hangs-forever-cmp></hangs-forever-cmp>',
    });
    expect(Date.now() - start).toBeLessThan(2000);
    expect(output).not.toBeNull();
    expect(typeof output.__error).toBe('string');
  });
});

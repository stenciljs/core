import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';

import { stencilVite } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');
// Root is the package dir so Vite can find node_modules/@stencil/core
const pkgRoot = join(__dirname, '..');

async function buildFixture(filename: string): Promise<string> {
  const result = await build({
    root: pkgRoot,
    plugins: [stencilVite()],
    build: {
      write: false,
      rollupOptions: {
        input: join(fixturesDir, filename),
        // Keep @stencil/core and virtual: as externals — we're testing the
        // plugin's transform/load hooks, not the Stencil runtime itself.
        external: [/^@stencil\/core/, /^virtual:/],
      },
    },
    logLevel: 'silent',
  });

  const output = Array.isArray(result) ? result[0] : result;
  if (!('output' in output) || !output.output) {
    throw new Error('Vite build failed to produce output');
  }
  return output.output
    .filter((c) => c.type === 'chunk')
    .map((c) => c.code)
    .join('\n');
}

describe('@stencil/unplugin integration', () => {
  it('transforms a basic component — tag name is registered', async () => {
    const code = await buildFixture('my-button.tsx');
    expect(code).toMatch(/my-button/);
    expect(code).toContain('defineCustomElement');
  });

  it('inlines styleUrl CSS as a default export function', async () => {
    const code = await buildFixture('my-card.tsx');
    expect(code).toMatch(/my-card/);
    // CSS content from my-card.css is embedded as a string
    expect(code).toContain('coral');
  });

  it('resolves cross-file inheritance — inherited @Prop appears in output', async () => {
    const code = await buildFixture('my-derived.tsx');
    expect(code).toMatch(/my-derived/);
    // Both the inherited prop and the own prop must be in the compact member meta
    expect(code).toMatch(/baseProp/);
    expect(code).toMatch(/ownProp/);
  });

  it('inline Mixin — component bundles and registers tag', async () => {
    const code = await buildFixture('my-mixin-cmp.tsx');
    expect(code).toMatch(/my-mixin-cmp/);
    expect(code).toContain('defineCustomElement');
    expect(code).toMatch(/name/); // own @Prop present in meta
  });

  it('cross-file Mixin factory — component bundles and registers tag', async () => {
    const code = await buildFixture('my-cross-mixin-cmp.tsx');
    expect(code).toMatch(/my-cross-mixin-cmp/);
    expect(code).toContain('defineCustomElement');
  });

  it('resolves 3-level cross-file chain — plain base class gets HTMLElement, middle @Prop inherited', async () => {
    const code = await buildFixture('my-deep-derived.tsx');
    expect(code).toMatch(/my-deep-derived/);
    expect(code).toMatch(/middleProp/);
    expect(code).toMatch(/deepProp/);
    // GrandBase (plain class) must have HTMLElement in the chain — verified
    // at runtime in browser.spec.ts; here we just check the bundle is valid.
    expect(code).toContain('defineCustomElement');
  });
});

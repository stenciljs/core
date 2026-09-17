import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it, beforeAll } from 'vitest';
import type { CustomElementsManifest } from '@stencil/core/compiler';

import { getStencilCEM, stencilVite } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');
// Root is the package dir so Vite can find node_modules/@stencil/core
const pkgRoot = join(__dirname, '..');

describe('@stencil/unplugin docs / CEM integration', () => {
  let cem: CustomElementsManifest;

  beforeAll(async () => {
    await build({
      root: pkgRoot,
      plugins: [stencilVite({ docs: true })],
      build: {
        write: false,
        rollupOptions: {
          input: join(fixturesDir, 'my-input.tsx'),
          external: [/^@stencil\/core/, /^virtual:/],
        },
      },
      logLevel: 'silent',
    });

    cem = getStencilCEM();
  });

  const findField = (name: string) => {
    const decl = cem.modules
      .flatMap((mod) => mod.declarations ?? [])
      .find((d) => 'tagName' in d && d.tagName === 'my-input');
    const field = decl?.members?.find((m) => m.kind === 'field' && m.name === name);
    if (!field) throw new Error(`field "${name}" not found on my-input in CEM output`);
    return field;
  };

  it('resolves a real type for an inherited number prop instead of any', () => {
    expect(findField('size').type?.text).toBe('number');
  });

  it('resolves a real type for an inherited boolean prop instead of any', () => {
    expect(findField('disabled').type?.text).toBe('boolean');
  });

  it('resolves and re-anchors an inherited prop whose type is imported from a third file', () => {
    // patchType wraps union expansions in parens; TypeScript's typeToString
    // defaults to double-quoted string literals.
    expect(findField('validator').type?.text).toBe(`("required" | "optional")`);
  });
});

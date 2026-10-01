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

  describe('CSS-only components (no .tsx/JS backing)', () => {
    const findDecl = (tagName: string) =>
      cem.modules
        .flatMap((mod) => mod.declarations ?? [])
        .find((d) => 'tagName' in d && d.tagName === tagName);

    it('discovers a CSS-only component via the buildStart scan, alongside real components', () => {
      const decl = findDecl('my-css-badge');
      expect(decl).toBeTruthy();
      expect(decl?.customElement).toBe(true);
      expect(decl?.description).toContain('A CSS-only badge');
    });

    it('includes an explicit @attr annotation with its declared type', () => {
      const decl = findDecl('my-css-badge');
      const attr = decl?.attributes?.find((a) => a.name === 'dismissible');
      expect(attr?.type?.text).toBe('boolean');
      expect(attr?.description).toBe('Whether the badge can be dismissed.');
    });

    it('auto-detects an attribute-selector literal as a variant type', () => {
      const decl = findDecl('my-css-badge');
      const attr = decl?.attributes?.find((a) => a.name === 'variant');
      expect(attr?.type?.text).toBe(`"danger" | (string & {})`);
    });

    it('auto-detects a documented custom property', () => {
      const decl = findDecl('my-css-badge');
      expect(decl?.cssProperties).toEqual([
        { name: '--badge-padding', description: 'Inner spacing.' },
      ]);
    });
  });

  describe('regular components (styleUrl)', () => {
    const findDecl = (tagName: string) =>
      cem.modules
        .flatMap((mod) => mod.declarations ?? [])
        .find((d) => 'tagName' in d && d.tagName === tagName);

    it('auto-detects a documented :host custom property from an external stylesheet', () => {
      const decl = findDecl('my-styled');
      expect(decl?.cssProperties).toEqual([
        { name: '--my-styled-accent', description: 'Accent color for the styled box.' },
      ]);
    });
  });
});

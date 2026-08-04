import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { describe, expect, it } from 'vitest';

import { transpile } from '../../transpile';

const fixturesDir = join(__dirname, 'fixtures');

const fixture = (name: string) => readFileSync(join(fixturesDir, name), 'utf-8');

/**
 * A `resolveImport` callback backed by the real filesystem.
 * Tries `.ts` then `.tsx` extensions when none is present on the specifier.
 */
const diskResolver = (specifier: string, importer: string) => {
  const base = join(dirname(importer), specifier);
  for (const ext of ['.ts', '.tsx', '']) {
    const candidate = base + ext;
    if (existsSync(candidate)) {
      return { code: readFileSync(candidate, 'utf-8'), path: candidate };
    }
  }
  return null;
};

/**
 * Tests for `transpile()` when a component uses cross-file class inheritance.
 *
 * Two resolution strategies are covered per scenario:
 *  - **disk** — parent files exist on disk; resolved via `buildExtendsTree`
 *    (the full-compiler path, using `currentDirectory`).
 *  - **resolveImport** — parent source is supplied via a callback, either
 *    reading from disk or from an in-memory map (useful for browser / bundler
 *    contexts where the filesystem is not directly accessible).
 */
describe('transpile() – cross-file class extension', () => {
  describe('single-level base class', () => {
    const assertSingleLevel = (results: Awaited<ReturnType<typeof transpile>>) => {
      expect(results.diagnostics).toHaveLength(0);
      const cmp = results.data?.[0];
      expect(cmp).toBeDefined();
      expect(cmp.properties.map((p: any) => p.name)).toContain('ownProp');
      expect(cmp.properties.map((p: any) => p.name)).toContain('baseProp');
      expect(cmp.states.map((s: any) => s.name)).toContain('baseState');
      expect(cmp.methods.map((m: any) => m.name)).toContain('baseMethod');
      expect(cmp.events.map((e: any) => e.name)).toContain('baseEvent');
    };

    const singleLevelCode = `
      import { Component, Prop } from '@stencil/core';
      import { ExtendsBase } from './extends-base';

      @Component({ tag: 'my-component' })
      export class MyComponent extends ExtendsBase {
        @Prop() ownProp: string = 'own';
      }
    `;

    it('resolves the base class from disk (full-compiler path)', async () => {
      assertSingleLevel(
        await transpile(singleLevelCode, {
          file: join(fixturesDir, 'my-component.tsx'),
          target: 'es2022',
          currentDirectory: fixturesDir,
        }),
      );
    });

    it('resolves the base class via resolveImport (disk)', async () => {
      assertSingleLevel(
        await transpile(singleLevelCode, {
          file: join(fixturesDir, 'my-component.tsx'),
          target: 'es2022',
          resolveImport: diskResolver,
        }),
      );
    });

    it('resolves the base class via resolveImport (virtual / no disk)', async () => {
      const files: Record<string, string> = {
        './extends-base': fixture('extends-base.ts'),
      };
      assertSingleLevel(
        await transpile(singleLevelCode, {
          file: 'my-component.tsx',
          target: 'es2022',
          resolveImport: (specifier) => {
            const code = files[specifier];
            return code ? { code, path: `/virtual${specifier}.ts` } : null;
          },
        }),
      );
    });
  });

  describe('two-level inheritance chain', () => {
    const assertTwoLevel = (results: Awaited<ReturnType<typeof transpile>>) => {
      expect(results.diagnostics).toHaveLength(0);
      const cmp = results.data?.[0];
      expect(cmp).toBeDefined();
      const propNames = cmp.properties.map((p: any) => p.name);
      expect(propNames).toContain('ownProp');
      expect(propNames).toContain('intermediateProp');
      expect(propNames).toContain('baseProp');
      const eventNames = cmp.events.map((e: any) => e.name);
      expect(eventNames).toContain('intermediateEvent');
      expect(eventNames).toContain('baseEvent');
    };

    const twoLevelCode = `
      import { Component, Prop } from '@stencil/core';
      import { ExtendsIntermediate } from './extends-intermediate';

      @Component({ tag: 'my-component' })
      export class MyComponent extends ExtendsIntermediate {
        @Prop() ownProp: string = 'own';
      }
    `;

    it('resolves the full chain from disk (full-compiler path)', async () => {
      assertTwoLevel(
        await transpile(twoLevelCode, {
          file: join(fixturesDir, 'my-component.tsx'),
          target: 'es2022',
          currentDirectory: fixturesDir,
        }),
      );
    });

    it('resolves the full chain via resolveImport (disk)', async () => {
      assertTwoLevel(
        await transpile(twoLevelCode, {
          file: join(fixturesDir, 'my-component.tsx'),
          target: 'es2022',
          resolveImport: diskResolver,
        }),
      );
    });

    it('resolves the full chain via resolveImport (virtual / no disk)', async () => {
      const files: Record<string, string> = {
        './extends-base': fixture('extends-base.ts'),
        './extends-intermediate': fixture('extends-intermediate.ts'),
      };
      assertTwoLevel(
        await transpile(twoLevelCode, {
          file: 'my-component.tsx',
          target: 'es2022',
          resolveImport: (specifier) => {
            const code = files[specifier];
            return code ? { code, path: `/virtual${specifier}.ts` } : null;
          },
        }),
      );
    });
  });

  it('deduplicates members when the child re-declares an inherited @Prop', async () => {
    const files: Record<string, string> = {
      './extends-base': fixture('extends-base.ts'),
    };
    const results = await transpile(
      `
      import { Component, Prop } from '@stencil/core';
      import { ExtendsBase } from './extends-base';

      @Component({ tag: 'my-component' })
      export class MyComponent extends ExtendsBase {
        @Prop() baseProp: string = 'overridden';
      }
      `,
      {
        file: 'my-component.tsx',
        target: 'es2022',
        resolveImport: (specifier) => {
          const code = files[specifier];
          return code ? { code, path: `/virtual${specifier}.ts` } : null;
        },
      },
    );

    expect(results.diagnostics).toHaveLength(0);

    const cmp = results.data?.[0];
    const propNames = cmp.properties.map((p: any) => p.name);
    expect(propNames.filter((n: string) => n === 'baseProp')).toHaveLength(1);
  });

  it('resolves a base class declared in the same file (full-compiler path)', async () => {
    const results = await transpile(
      `
      import { Component, Prop, State, Method } from '@stencil/core';

      class ExtendsBase {
        @Prop() baseProp: string = 'base';
        @State() baseState: string = 'base';
        @Method() async baseMethod() {}
      }

      @Component({ tag: 'my-component' })
      export class MyComponent extends ExtendsBase {
        @Prop() ownProp: string = 'own';
      }
      `,
      {
        file: join(fixturesDir, 'my-component.tsx'),
        target: 'es2022',
        currentDirectory: fixturesDir,
      },
    );

    expect(results.diagnostics).toHaveLength(0);
    const cmp = results.data?.[0];
    expect(cmp).toBeDefined();
    expect(cmp.properties.map((p: any) => p.name)).toContain('ownProp');
    expect(cmp.properties.map((p: any) => p.name)).toContain('baseProp');
    expect(cmp.states.map((s: any) => s.name)).toContain('baseState');
    expect(cmp.methods.map((m: any) => m.name)).toContain('baseMethod');
  });
});

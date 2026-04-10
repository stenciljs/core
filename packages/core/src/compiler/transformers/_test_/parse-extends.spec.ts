import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { transpile } from '../../transpile';

const fixturesDir = join(__dirname, 'fixtures');

/**
 * Reads a fixture file from the `_test_/fixtures` directory relative to this spec.
 */
const fixture = (name: string) => readFileSync(join(fixturesDir, name), 'utf-8');

/**
 * Tests for `transpile()` when a component uses cross-file class inheritance.
 *
 * The stateless `transpile()` API previously failed to resolve parent
 * classes that lived in separate modules because:
 *  1. `noResolve: true` prevented TypeScript module resolution in `tsResolveModuleName`
 *  2. The `mergeExtendedClassMeta` loop bailed early when `compilerCtx.moduleMap`
 *     had no entry for the parent (the map is always empty in a fresh transpile context)
 *
 * Each test below has two variants:
 *  - **disk** – parent files exist on disk; `currentDirectory` points at the
 *    fixtures folder so the relative imports resolve naturally via the file system.
 *  - **virtual** – parent files are supplied as strings via `extraFiles` with no
 *    disk access required (useful in browser or in-memory build contexts).
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

    it('resolves the base class from disk', async () => {
      assertSingleLevel(
        await transpile(singleLevelCode, {
          file: join(fixturesDir, 'my-component.tsx'),
          target: 'es2022',
          currentDirectory: fixturesDir,
        }),
      );
    });

    it('resolves the base class via extraFiles (virtual / no disk)', async () => {
      assertSingleLevel(
        await transpile(singleLevelCode, {
          file: 'my-component.tsx',
          target: 'es2022',
          extraFiles: {
            './extends-base.ts': fixture('extends-base.ts'),
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

    it('resolves the full chain from disk', async () => {
      assertTwoLevel(
        await transpile(twoLevelCode, {
          file: join(fixturesDir, 'my-component.tsx'),
          target: 'es2022',
          currentDirectory: fixturesDir,
        }),
      );
    });

    it('resolves the full chain via extraFiles (virtual / no disk)', async () => {
      assertTwoLevel(
        await transpile(twoLevelCode, {
          file: 'my-component.tsx',
          target: 'es2022',
          extraFiles: {
            './extends-base.ts': fixture('extends-base.ts'),
            './extends-intermediate.ts': fixture('extends-intermediate.ts'),
          },
        }),
      );
    });
  });

  it('deduplicates members when the child re-declares an inherited @Prop', async () => {
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
        extraFiles: {
          './extends-base.ts': fixture('extends-base.ts'),
        },
      },
    );

    expect(results.diagnostics).toHaveLength(0);

    const cmp = results.data?.[0];
    const propNames = cmp.properties.map((p: any) => p.name);
    // Only one entry for `baseProp` — it should not appear twice
    expect(propNames.filter((n: string) => n === 'baseProp')).toHaveLength(1);
  });
});

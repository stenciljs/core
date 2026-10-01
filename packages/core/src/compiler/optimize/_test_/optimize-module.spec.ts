import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockValidatedConfig } from '../../../testing';
import { mockCompilerCtx } from '../../../testing/compiler';
import { getOxcMinifyOptions, optimizeModule } from '../optimize-module';

describe('optimizeModule', () => {
  const runOptimize = (config: d.ValidatedConfig, opts: Parameters<typeof optimizeModule>[2]) => {
    const compilerCtx = mockCompilerCtx(config);
    return optimizeModule(config, compilerCtx, opts);
  };

  it('returns the input unmodified when minify is disabled', async () => {
    const config = mockValidatedConfig();
    const results = await runOptimize(config, { input: 'const foo = 1;', minify: false });

    expect(results.diagnostics).toHaveLength(0);
    expect(results.output).toBe('const foo = 1;');
  });

  it('returns an empty result for empty input', async () => {
    const config = mockValidatedConfig();
    const results = await runOptimize(config, { input: '', minify: true });

    expect(results.output).toBe('');
  });

  describe.each(['terser', 'oxc'] as const)('with jsMinifier: %s', (jsMinifier) => {
    it('minifies JavaScript', async () => {
      const config = mockValidatedConfig({ jsMinifier });
      const results = await runOptimize(config, {
        input: `function greet(name) {\n  return 'hello, ' + name;\n}`,
        minify: true,
      });

      expect(results.diagnostics).toHaveLength(0);
      expect(results.output.length).toBeLessThan(
        `function greet(name) {\n  return 'hello, ' + name;\n}`.length,
      );
    });

    it('mangles internal `$foo$`-style properties but preserves plain property names', async () => {
      const config = mockValidatedConfig({ jsMinifier });
      // values must be non-constant-foldable (Date.now(), not a literal) so terser's full
      // compress can't inline the property reads away entirely - otherwise there'd be no
      // property access left in the output to observe mangling on
      const results = await runOptimize(config, {
        input: `function make(v) { return { $lazyInstance$: v, plainProp: v + 1 }; }\nconst hostRef = make(Date.now());\nconsole.log(hostRef.$lazyInstance$, hostRef.plainProp);`,
        minify: true,
      });

      expect(results.diagnostics).toHaveLength(0);
      expect(results.output).not.toContain('$lazyInstance$');
      expect(results.output).toContain('plainProp');
    });

    it('reserves `$hostElement$` from property mangling', async () => {
      const config = mockValidatedConfig({ jsMinifier });
      const results = await runOptimize(config, {
        input: `const hostRef = { $hostElement$: 1 };\nconsole.log(hostRef);`,
        minify: true,
      });

      expect(results.diagnostics).toHaveLength(0);
      expect(results.output).toContain('$hostElement$');
    });

    it('strips the disconnectedCallback stub for core builds', async () => {
      const config = mockValidatedConfig({ jsMinifier });
      const results = await runOptimize(config, {
        input: `const foo = { disconnectedCallback(){}, connectedCallback(){} };`,
        minify: true,
        isCore: true,
      });

      expect(results.diagnostics).toHaveLength(0);
      expect(results.output).not.toContain('disconnectedCallback(){},');
    });

    it('keeps readable output in debug mode', async () => {
      const config = mockValidatedConfig({ jsMinifier, logLevel: 'debug' });
      // two call sites so terser doesn't inline the function away entirely - that would remove
      // the `greet` identifier regardless of mangle settings, defeating the point of this test
      const results = await runOptimize(config, {
        input: `function greet(name) {\n  return 'hello, ' + name;\n}\nconsole.log(greet('world'), greet('there'));`,
        minify: true,
      });

      expect(results.diagnostics).toHaveLength(0);
      expect(results.output).toContain('greet');
    });
  });
});

describe('getOxcMinifyOptions', () => {
  it('includes getHostRef as a manual pure function for core builds only', () => {
    const config = mockValidatedConfig();

    const coreOpts = getOxcMinifyOptions(config, { input: '', isCore: true }, false);
    const nonCoreOpts = getOxcMinifyOptions(config, { input: '', isCore: false }, false);

    if (typeof coreOpts.compress !== 'object' || typeof nonCoreOpts.compress !== 'object') {
      throw new Error('expected compress to be an options object');
    }
    expect(coreOpts.compress.treeshake?.manualPureFunctions).toEqual(['getHostRef']);
    expect(nonCoreOpts.compress.treeshake?.manualPureFunctions).toEqual([]);
  });

  it('reserves $hostElement$ and targets $foo$-style properties', () => {
    const config = mockValidatedConfig();

    const opts = getOxcMinifyOptions(config, { input: '' }, false);

    expect(opts.mangleProps?.reserved).toEqual([
      '$hostElement$',
      '$flags$',
      '$tagName$',
      '$members$',
      '$listeners$',
      '$attrsToReflect$',
      '$watchers$',
      '$lazyBundleId$',
      '$serializers$',
      '$deserializers$',
    ]);
    expect(opts.mangleProps?.include.test('$lazyInstance$')).toBe(true);
    expect(opts.mangleProps?.include.test('plainProp')).toBe(false);
  });
});

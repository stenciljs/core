import path from 'path';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type * as d from '@stencil/core';

import { SSR_WASM } from '../../../utils';
import * as optimizeModuleMod from '../../optimize/optimize-module';
import { writeSsrWasmOutput } from '../ssr-wasm/generate-ssr-wasm';

// vi.mock is hoisted above all variable declarations, so the factory must reference
// a variable created via vi.hoisted (which is also hoisted).
const mockExecFile = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({ execFile: mockExecFile }));

const successOutput = {
  output: [
    {
      type: 'chunk' as const,
      fileName: 'index.js',
      code: 'export const test = "unminified code";',
      isEntry: true,
    },
  ],
};

describe('ssr-wasm', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;
  let outputTarget: d.OutputTargetSsrWasm;

  beforeEach(() => {
    config = mockValidatedConfig();
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);

    compilerCtx.fs.writeFile = vi.fn().mockResolvedValue(undefined);
    outputTarget = {
      type: SSR_WASM,
      dir: path.join(config.rootDir, 'dist', 'ssr-wasm'),
      minify: false,
    };

    // Default: extism-js succeeds
    mockExecFile.mockImplementation((_file: string, _args: string[], callback: Function) => {
      callback(null, '', '');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockExecFile.mockReset();
  });

  describe('minification', () => {
    let optimizeModuleSpy: MockInstance;

    beforeEach(() => {
      optimizeModuleSpy = vi.spyOn(optimizeModuleMod, 'optimizeModule').mockResolvedValue({
        output: 'const minified="code";',
        diagnostics: [],
        sourceMap: undefined,
      });
    });

    it('calls optimizeModule when minify is true', async () => {
      await writeSsrWasmOutput(
        config,
        compilerCtx,
        buildCtx,
        { ...outputTarget, minify: true },
        successOutput as any,
      );

      expect(optimizeModuleSpy).toHaveBeenCalledWith(
        config,
        compilerCtx,
        expect.objectContaining({ minify: true }),
      );
    });

    it('does not call optimizeModule when minify is false', async () => {
      await writeSsrWasmOutput(
        config,
        compilerCtx,
        buildCtx,
        { ...outputTarget, minify: false },
        successOutput as any,
      );

      expect(optimizeModuleSpy).not.toHaveBeenCalled();
    });

    it('does not call optimizeModule when minify is undefined', async () => {
      const target = { ...outputTarget } as d.OutputTargetSsrWasm;
      delete (target as any).minify;

      await writeSsrWasmOutput(config, compilerCtx, buildCtx, target, successOutput as any);

      expect(optimizeModuleSpy).not.toHaveBeenCalled();
    });

    it('writes minified code when optimizeModule succeeds', async () => {
      await writeSsrWasmOutput(
        config,
        compilerCtx,
        buildCtx,
        { ...outputTarget, minify: true },
        successOutput as any,
      );

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('index.js'),
        'const minified="code";',
        expect.any(Object),
      );
    });

    it('falls back to unminified code when optimizeModule returns errors', async () => {
      optimizeModuleSpy.mockResolvedValue({
        output: undefined,
        diagnostics: [{ level: 'error', messageText: 'minify failed' } as any],
        sourceMap: undefined,
      });

      await writeSsrWasmOutput(
        config,
        compilerCtx,
        buildCtx,
        { ...outputTarget, minify: true },
        successOutput as any,
      );

      // Original unminified code should still be written
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('index.js'),
        expect.stringContaining('unminified code'),
        expect.any(Object),
      );
    });
  });

  describe('compileToWasm', () => {
    it('writes index.js and plugin.d.ts then calls extism-js', async () => {
      await writeSsrWasmOutput(config, compilerCtx, buildCtx, outputTarget, successOutput as any);

      expect(vi.mocked(compilerCtx.fs.writeFile)).toHaveBeenCalledWith(
        expect.stringMatching(/index\.js$/),
        expect.any(String),
        expect.objectContaining({ immediateWrite: true }),
      );
      expect(vi.mocked(compilerCtx.fs.writeFile)).toHaveBeenCalledWith(
        expect.stringMatching(/plugin\.d\.ts$/),
        expect.any(String),
        expect.objectContaining({ immediateWrite: true }),
      );
      expect(mockExecFile).toHaveBeenCalled();
    });

    it('calls extism-js directly with js, interface, and wasm paths', async () => {
      const dir = outputTarget.dir!;

      await writeSsrWasmOutput(config, compilerCtx, buildCtx, outputTarget, successOutput as any);

      expect(mockExecFile).toHaveBeenCalledWith(
        'extism-js',
        [
          path.join(dir, 'index.js'),
          '-i',
          path.join(dir, 'plugin.d.ts'),
          '-o',
          path.join(dir, 'index.wasm'),
        ],
        expect.any(Function),
      );
    });

    it('adds a warning with install link when extism-js is not found (ENOENT)', async () => {
      mockExecFile.mockImplementation((_file: string, _args: string[], callback: Function) => {
        const err = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
        callback(err);
      });

      await writeSsrWasmOutput(config, compilerCtx, buildCtx, outputTarget, successOutput as any);

      const warnings = buildCtx.diagnostics.filter((d) => d.level === 'warn');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].messageText).toContain('extism-js not found');
      expect(warnings[0].messageText).toContain('https://github.com/extism/js-pdk');
    });

    it('adds a warning with the error message when extism-js compilation fails', async () => {
      mockExecFile.mockImplementation((_file: string, _args: string[], callback: Function) => {
        callback(new Error('syntax error at line 42'));
      });

      await writeSsrWasmOutput(config, compilerCtx, buildCtx, outputTarget, successOutput as any);

      const warnings = buildCtx.diagnostics.filter((d) => d.level === 'warn');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].messageText).toContain('extism-js compile failed');
      expect(warnings[0].messageText).toContain('syntax error at line 42');
    });

    it('adds no diagnostics when extism-js succeeds', async () => {
      await writeSsrWasmOutput(config, compilerCtx, buildCtx, outputTarget, successOutput as any);

      const warnings = buildCtx.diagnostics.filter((d) => d.level === 'warn');
      expect(warnings).toHaveLength(0);
    });

    it('skips non-chunk rolldown output entries', async () => {
      const mixedOutput = {
        output: [
          { type: 'asset' as const, fileName: 'styles.css', source: 'body {}' },
          { ...successOutput.output[0] },
        ],
      };

      await writeSsrWasmOutput(config, compilerCtx, buildCtx, outputTarget, mixedOutput as any);

      // Two writeFile calls for the one chunk (index.js + plugin.d.ts); asset is skipped
      expect(compilerCtx.fs.writeFile).toHaveBeenCalledTimes(2);
    });
  });
});

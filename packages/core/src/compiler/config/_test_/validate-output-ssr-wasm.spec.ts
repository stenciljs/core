import { beforeEach, describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mockConfig, mockLoadConfigInit } from '../../../testing';
import { isOutputTargetSsrWasm, join, resolve, SSR_WASM } from '../../../utils';
import { validateConfig } from '../validate-config';

describe('validateSsrWasmOutputTarget', () => {
  let config: d.Config;

  const rootDir = resolve('/');
  const defaultDir = join(rootDir, 'dist', 'ssr-wasm');

  beforeEach(() => {
    config = mockConfig();
  });

  describe('defaults', () => {
    it('sets correct default directory', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      expect(ssrWasm).toBeDefined();
      expect(ssrWasm?.dir).toBe(defaultDir);
    });

    it('uses custom directory when specified', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM, dir: 'my-ssr-wasm-output' };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      expect(ssrWasm?.dir).toBe(join(rootDir, 'my-ssr-wasm-output'));
    });

    it('defaults empty to true', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      expect(ssrWasm?.empty).toBe(true);
    });

    it('preserves empty when explicitly set to false', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM, empty: false };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      expect(ssrWasm?.empty).toBe(false);
    });

    it('defaults minify to false', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      expect(ssrWasm?.minify).toBe(false);
    });

    it('preserves minify when explicitly set to true', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM, minify: true };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      expect(ssrWasm?.minify).toBe(true);
    });

    it('defaults skipInDev to true (opt-in only)', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      expect(ssrWasm?.skipInDev).toBe(true);
    });

    it('preserves skipInDev when explicitly set to false', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM, skipInDev: false };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      expect(ssrWasm?.skipInDev).toBe(false);
    });

    it('preserves skipInDev when explicitly set to true', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM, skipInDev: true };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      expect(ssrWasm?.skipInDev).toBe(true);
    });

    it('does not add Node.js built-ins to externals (must be self-contained for WASM)', () => {
      const target: d.OutputTargetSsrWasm = { type: SSR_WASM };
      config.outputTargets = [target];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasm = validatedConfig.outputTargets.find(isOutputTargetSsrWasm);
      // ssr-wasm has no external field — everything is bundled into the binary
      expect((ssrWasm as any)?.external).toBeUndefined();
    });
  });

  describe('multiple targets', () => {
    it('validates all ssr-wasm targets in outputTargets', () => {
      const target1: d.OutputTargetSsrWasm = { type: SSR_WASM, dir: 'dist/wasm-a' };
      const target2: d.OutputTargetSsrWasm = { type: SSR_WASM, dir: 'dist/wasm-b' };
      config.outputTargets = [target1, target2];

      const { config: validatedConfig } = validateConfig(config, mockLoadConfigInit());

      const ssrWasmTargets = validatedConfig.outputTargets.filter(isOutputTargetSsrWasm);
      expect(ssrWasmTargets).toHaveLength(2);
      expect(ssrWasmTargets[0].dir).toBe(join(rootDir, 'dist/wasm-a'));
      expect(ssrWasmTargets[1].dir).toBe(join(rootDir, 'dist/wasm-b'));
    });
  });
});

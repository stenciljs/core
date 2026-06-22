import { describe, it, expect } from 'vitest';

import { generateStencilConfig, generatePackageJsonFields } from './config.js';

describe('generateStencilConfig', () => {
  describe('zero-config cases (returns null)', () => {
    it('returns null for empty outputs with no signals or docs', () => {
      expect(
        generateStencilConfig({ namespace: 'MyLib', outputs: [], signals: false, docs: [] }),
      ).toBeNull();
    });

    it('returns null when only loader is selected with no signals or docs', () => {
      expect(
        generateStencilConfig({
          namespace: 'MyLib',
          outputs: ['loader'],
          signals: false,
          docs: [],
        }),
      ).toBeNull();
    });
  });

  describe('namespace', () => {
    it('includes the namespace in the config', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['standalone'],
        signals: false,
        docs: [],
      });
      expect(result).toContain(`namespace: 'MyLib'`);
    });
  });

  describe('output targets', () => {
    it('includes standalone output target', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['standalone'],
        signals: false,
        docs: [],
      });
      expect(result).toContain(`{ type: 'standalone' }`);
    });

    it('includes ssr output target', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['ssr'],
        signals: false,
        docs: [],
      });
      expect(result).toContain(`{ type: 'ssr' }`);
    });

    it('includes ssr-wasm output target', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['ssr-wasm'],
        signals: false,
        docs: [],
      });
      expect(result).toContain(`{ type: 'ssr-wasm' }`);
    });

    it('includes www output target', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['www'],
        signals: false,
        docs: [],
      });
      expect(result).toContain(`{ type: 'www' }`);
    });

    it('includes multiple output targets', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['loader', 'standalone'],
        signals: false,
        docs: [],
      });
      expect(result).toContain(`{ type: 'loader-bundle' }`);
      expect(result).toContain(`{ type: 'standalone' }`);
    });

    it('forces a config file when loader is combined with signals', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['loader'],
        signals: true,
        docs: [],
      });
      expect(result).not.toBeNull();
      expect(result).toContain(`{ type: 'loader-bundle' }`);
    });
  });

  describe('signals', () => {
    it('emits signalBacking at the top level of the config object', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['standalone'],
        signals: true,
        docs: [],
      });
      expect(result).toContain('signalBacking: true');
    });

    it('does not nest signalBacking inside extras or compat', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['standalone'],
        signals: true,
        docs: [],
      })!;
      expect(result).not.toContain('extras');
      expect(result).not.toContain('compat');
    });

    it('omits signalBacking when signals is false', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: ['standalone'],
        signals: false,
        docs: [],
      });
      expect(result).not.toContain('signalBacking');
    });

    it('forces a config file when signals is true even with no outputs', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: [],
        signals: true,
        docs: [],
      });
      expect(result).not.toBeNull();
      expect(result).toContain('signalBacking: true');
    });
  });

  describe('docs', () => {
    it('includes CEM docs output target', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: [],
        signals: false,
        docs: ['cem'],
      });
      expect(result).toContain(`{ type: 'docs-custom-elements-manifest'`);
    });

    it('includes loader-bundle alongside docs when no explicit outputs are selected', () => {
      // Ensures plugins adding their own outputTargets (e.g. reactOutputTarget) don't
      // orphan the loader-bundle dist files that package.json is set up to point to.
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: [],
        signals: false,
        docs: ['cem'],
      });
      expect(result).toContain(`{ type: 'loader-bundle' }`);
    });

    it('includes JSON docs output target', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: [],
        signals: false,
        docs: ['json'],
      });
      expect(result).toContain(`{ type: 'docs-json'`);
    });

    it('includes VSCode docs output target', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: [],
        signals: false,
        docs: ['vscode'],
      });
      expect(result).toContain(`{ type: 'docs-vscode'`);
    });

    it('forces a config file when docs are selected', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: [],
        signals: false,
        docs: ['cem'],
      });
      expect(result).not.toBeNull();
    });

    it('includes multiple docs output targets', () => {
      const result = generateStencilConfig({
        namespace: 'MyLib',
        outputs: [],
        signals: false,
        docs: ['cem', 'vscode'],
      });
      expect(result).toContain(`docs-custom-elements-manifest`);
      expect(result).toContain(`docs-vscode`);
    });
  });

  describe('combined selections', () => {
    it('includes outputs, signals, and docs together', () => {
      const result = generateStencilConfig({
        namespace: 'Acme',
        outputs: ['standalone'],
        signals: true,
        docs: ['cem'],
      })!;
      expect(result).toContain(`namespace: 'Acme'`);
      expect(result).toContain(`{ type: 'standalone' }`);
      expect(result).toContain('signalBacking: true');
      expect(result).toContain(`docs-custom-elements-manifest`);
    });
  });
});

describe('generatePackageJsonFields', () => {
  it('returns loader fields for empty outputs (zero-config default)', () => {
    expect(generatePackageJsonFields([])).toEqual({
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });
  });

  it('returns loader fields when loader is explicitly selected', () => {
    expect(generatePackageJsonFields(['loader'])).toEqual({
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });
  });

  it('returns standalone fields when only standalone is selected', () => {
    expect(generatePackageJsonFields(['standalone'])).toEqual({
      type: 'module',
      module: './dist/standalone/index.js',
      types: './dist/types/standalone.d.ts',
    });
  });

  it('returns ssr fields when only ssr is selected', () => {
    expect(generatePackageJsonFields(['ssr'])).toEqual({
      type: 'module',
      module: './dist/ssr/index.js',
      types: './dist/ssr/index.d.ts',
    });
  });

  it('returns ssr-wasm fields when only ssr-wasm is selected', () => {
    expect(generatePackageJsonFields(['ssr-wasm'])).toEqual({
      type: 'module',
      module: './dist/ssr-wasm/index.js',
      types: './dist/ssr-wasm/plugin.d.ts',
    });
  });

  it('returns empty object for www-only (non-publishable)', () => {
    expect(generatePackageJsonFields(['www'])).toEqual({});
  });

  it('loader wins over standalone when both are selected', () => {
    expect(generatePackageJsonFields(['loader', 'standalone'])).toEqual({
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });
  });

  it('loader wins over ssr when both are selected', () => {
    expect(generatePackageJsonFields(['loader', 'ssr'])).toEqual({
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });
  });

  it('standalone wins over ssr when both are selected', () => {
    expect(generatePackageJsonFields(['standalone', 'ssr'])).toEqual({
      type: 'module',
      module: './dist/standalone/index.js',
      types: './dist/types/standalone.d.ts',
    });
  });

  it('ssr wins over ssr-wasm when both are selected', () => {
    expect(generatePackageJsonFields(['ssr', 'ssr-wasm'])).toEqual({
      type: 'module',
      module: './dist/ssr/index.js',
      types: './dist/ssr/index.d.ts',
    });
  });

  it('loader wins when combined with www', () => {
    expect(generatePackageJsonFields(['loader', 'www'])).toEqual({
      type: 'module',
      module: './dist/loader-bundle/index.js',
      types: './dist/types/loader.d.ts',
    });
  });

  it('standalone fields when standalone + www (no loader)', () => {
    expect(generatePackageJsonFields(['standalone', 'www'])).toEqual({
      type: 'module',
      module: './dist/standalone/index.js',
      types: './dist/types/standalone.d.ts',
    });
  });
});

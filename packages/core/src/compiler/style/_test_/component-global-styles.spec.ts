import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type * as d from '@stencil/core';

import {
  collectAndBuildComponentGlobalStyles,
  generateHydrateCss,
  hasStencilGlobalsImport,
  hasStencilHydrateImport,
  resolveStencilGlobalsImport,
  resolveStencilHydrateImport,
} from '../component-global-styles';

describe('component-global-styles', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  beforeEach(() => {
    config = mockValidatedConfig();
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
  });

  describe('hasStencilGlobalsImport', () => {
    it('detects double-quote import', () => {
      expect(hasStencilGlobalsImport(`@import "stencil-globals";`)).toBe(true);
    });

    it('detects single-quote import', () => {
      expect(hasStencilGlobalsImport(`@import 'stencil-globals';`)).toBe(true);
    });

    it('detects url() form', () => {
      expect(hasStencilGlobalsImport(`@import url("stencil-globals");`)).toBe(true);
    });

    it('returns false when not present', () => {
      expect(hasStencilGlobalsImport(`:root { color: red; }`)).toBe(false);
    });
  });

  describe('collectAndBuildComponentGlobalStyles', () => {
    it('returns empty string when no components have globalStyles', async () => {
      buildCtx.components = [];
      const result = await collectAndBuildComponentGlobalStyles(config, compilerCtx, buildCtx);
      expect(result).toBe('');
    });

    it('collects inline globalStyle strings', async () => {
      buildCtx.components = [
        mockCmp({ globalStyles: [{ styleStr: 'my-cmp { display: block; }', absolutePath: null }] }),
      ];
      const result = await collectAndBuildComponentGlobalStyles(config, compilerCtx, buildCtx);
      expect(result).toContain('my-cmp { display: block; }');
    });

    it('concatenates inline styles from multiple components', async () => {
      buildCtx.components = [
        mockCmp({ globalStyles: [{ styleStr: 'cmp-a { color: red; }', absolutePath: null }] }),
        mockCmp({ globalStyles: [{ styleStr: 'cmp-b { color: blue; }', absolutePath: null }] }),
      ];
      const result = await collectAndBuildComponentGlobalStyles(config, compilerCtx, buildCtx);
      expect(result).toContain('cmp-a { color: red; }');
      expect(result).toContain('cmp-b { color: blue; }');
    });

    it('skips components with no globalStyles', async () => {
      buildCtx.components = [
        mockCmp({ globalStyles: [] }),
        mockCmp({ globalStyles: [{ styleStr: 'cmp-b { color: blue; }', absolutePath: null }] }),
      ];
      const result = await collectAndBuildComponentGlobalStyles(config, compilerCtx, buildCtx);
      expect(result).toContain('cmp-b { color: blue; }');
    });
  });

  describe('resolveStencilGlobalsImport', () => {
    it('replaces @import "stencil-globals" with collected styles', async () => {
      buildCtx.components = [
        mockCmp({ globalStyles: [{ styleStr: 'my-cmp { display: block; }', absolutePath: null }] }),
      ];
      const css = `:root { --token: red; }\n@import "stencil-globals";\nbody { margin: 0; }`;
      const result = await resolveStencilGlobalsImport(
        css,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );
      expect(result).toContain('my-cmp { display: block; }');
      expect(result).toContain(':root { --token: red; }');
      expect(result).toContain('body { margin: 0; }');
      expect(result).not.toContain('@import "stencil-globals"');
    });

    it('replaces url() form', async () => {
      buildCtx.components = [
        mockCmp({ globalStyles: [{ styleStr: 'my-cmp { display: block; }', absolutePath: null }] }),
      ];
      const css = `@import url("stencil-globals");`;
      const result = await resolveStencilGlobalsImport(
        css,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );
      expect(result).not.toContain('@import');
      expect(result).toContain('my-cmp { display: block; }');
    });

    it('replaces all occurrences', async () => {
      buildCtx.components = [mockCmp({ globalStyles: [{ styleStr: 'x {}', absolutePath: null }] })];
      const css = `@import "stencil-globals";\nbody {}\n@import "stencil-globals";`;
      const result = await resolveStencilGlobalsImport(
        css,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );
      const count = (result.match(/@import "stencil-globals"/g) || []).length;
      expect(count).toBe(0);
    });

    it('registers file-based globalStyleUrl paths in cssModuleImports', async () => {
      buildCtx.components = [
        mockCmp({
          globalStyles: [{ styleStr: null, absolutePath: '/src/cmp-a.global.css' }],
        }),
      ];
      vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue('cmp-a {}');

      await resolveStencilGlobalsImport(
        `@import "stencil-globals";`,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );

      const imports = compilerCtx.cssModuleImports.get('/src/global.css');
      expect(imports).toContain('/src/cmp-a.global.css');
    });

    it('produces empty replacement when no components have globalStyles', async () => {
      buildCtx.components = [];
      const css = `:root {}\n@import "stencil-globals";\nbody {}`;
      const result = await resolveStencilGlobalsImport(
        css,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );
      expect(result).not.toContain('@import "stencil-globals"');
      expect(result).toContain(':root {}');
      expect(result).toContain('body {}');
    });
  });

  describe('hasStencilHydrateImport', () => {
    it('detects double-quote import', () => {
      expect(hasStencilHydrateImport(`@import "stencil-hydrate";`)).toBe(true);
    });

    it('detects single-quote import', () => {
      expect(hasStencilHydrateImport(`@import 'stencil-hydrate';`)).toBe(true);
    });

    it('detects url() form', () => {
      expect(hasStencilHydrateImport(`@import url("stencil-hydrate");`)).toBe(true);
    });

    it('returns false when not present', () => {
      expect(hasStencilHydrateImport(`:root { color: red; }`)).toBe(false);
    });
  });

  describe('generateHydrateCss', () => {
    it('returns empty string when hydratedFlag is null', () => {
      config.hydratedFlag = null;
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      expect(generateHydrateCss(config, buildCtx)).toBe('');
    });

    it('returns empty string when there are no components', () => {
      buildCtx.components = [];
      expect(generateHydrateCss(config, buildCtx)).toBe('');
    });

    it('generates FOUC css with default hydratedFlag', () => {
      config.hydratedFlag = {
        selector: 'class',
        name: 'hydrated',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      };
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      const result = generateHydrateCss(config, buildCtx);
      expect(result).toBe('my-cmp{visibility:hidden}.hydrated{visibility:inherit}');
    });

    it('sorts and joins multiple component tags', () => {
      config.hydratedFlag = {
        selector: 'class',
        name: 'hydrated',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      };
      buildCtx.components = [
        mockCmp({ tagName: 'cmp-z' }),
        mockCmp({ tagName: 'cmp-a' }),
        mockCmp({ tagName: 'cmp-m' }),
      ];
      const result = generateHydrateCss(config, buildCtx);
      expect(result).toMatch(/^cmp-a,cmp-m,cmp-z/);
    });

    it('uses attribute selector when configured', () => {
      config.hydratedFlag = {
        selector: 'attribute',
        name: 'hydrated',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      };
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      const result = generateHydrateCss(config, buildCtx);
      expect(result).toContain('[hydrated]');
    });
  });

  describe('resolveStencilHydrateImport', () => {
    it('replaces @import "stencil-hydrate" with FOUC css', () => {
      config.hydratedFlag = {
        selector: 'class',
        name: 'hydrated',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      };
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      const css = `:root {}\n@import "stencil-hydrate";\nbody {}`;
      const result = resolveStencilHydrateImport(css, config, buildCtx);
      expect(result).not.toContain('@import "stencil-hydrate"');
      expect(result).toContain('my-cmp{visibility:hidden}.hydrated{visibility:inherit}');
      expect(result).toContain(':root {}');
      expect(result).toContain('body {}');
    });

    it('replaces all occurrences', () => {
      config.hydratedFlag = {
        selector: 'class',
        name: 'hydrated',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      };
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      const css = `@import "stencil-hydrate";\nbody {}\n@import "stencil-hydrate";`;
      const result = resolveStencilHydrateImport(css, config, buildCtx);
      expect((result.match(/@import "stencil-hydrate"/g) ?? []).length).toBe(0);
    });

    it('produces empty replacement when hydratedFlag is null', () => {
      config.hydratedFlag = null;
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      const css = `body {}\n@import "stencil-hydrate";`;
      const result = resolveStencilHydrateImport(css, config, buildCtx);
      expect(result).not.toContain('@import "stencil-hydrate"');
      expect(result).toContain('body {}');
    });
  });
});

function mockCmp(overrides: Partial<d.ComponentCompilerMeta>): d.ComponentCompilerMeta {
  return {
    assetsDirs: [],
    attachInternalsMemberName: null,
    attachInternalsCustomStates: [],
    componentClassName: 'CmpA',
    dependencies: [],
    dependents: [],
    directDependencies: [],
    directDependents: [],
    docs: { text: '', tags: [] },
    doesExtend: false,
    elementRef: null,
    encapsulation: 'none',
    events: [],
    excludeFromCollection: false,
    formAssociated: false,
    hasAttributeChangedCallbackFn: false,
    hasConnectedCallbackFn: false,
    hasDisconnectedCallbackFn: false,
    hasElement: false,
    hasEvent: false,
    hasForcedUpdate: false,
    hasLifecycle: false,
    hasListenerTarget: false,
    hasMethod: false,
    hasMode: false,
    hasProp: false,
    hasPropBoolean: false,
    hasPropMutable: false,
    hasPropNumber: false,
    hasPropString: false,
    hasReflect: false,
    hasRenderFn: false,
    hasState: false,
    hasStyle: false,
    hasVdomAttribute: false,
    hasVdomClass: false,
    hasVdomFunctional: false,
    hasVdomKey: false,
    hasVdomListener: false,
    hasVdomPropOrAttr: false,
    hasVdomRef: false,
    hasVdomRender: false,
    hasVdomStyle: false,
    hasVdomText: false,
    hasVdomXlink: false,
    hasWatchCallback: false,
    internal: false,
    isCollectionDependency: false,
    isLegacy: false,
    jsFilePath: '/src/cmp-a.js',
    listeners: [],
    methods: [],
    patches: null,
    potentialCmpRefs: [],
    properties: [],
    shadowDelegatesFocus: false,
    shadowMode: null,
    slotAssignment: null,
    serializers: [],
    deserializers: [],
    sourceFilePath: '/src/cmp-a.tsx',
    sourceMapPath: '/src/cmp-a.js.map',
    states: [],
    styleDocs: [],
    styles: [],
    globalStyles: [],
    tagName: 'cmp-a',
    virtualProperties: [],
    watchers: [],
    ...overrides,
  } as d.ComponentCompilerMeta;
}

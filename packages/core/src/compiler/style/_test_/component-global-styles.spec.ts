import { describe, expect, it, beforeEach, vi } from 'vitest';
import type * as d from '@stencil/core';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import {
  collectAndBuildComponentGlobalStyles,
  collectCssOnlyComponentStyles,
  generateHydrateCss,
  hasStencilCssComponentsImport,
  hasStencilGlobalsImport,
  hasStencilHydrateImport,
  replaceStencilHydrateImport,
  resolveStencilCssComponentsImport,
  resolveStencilGlobalsImport,
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

    it('wraps in @layer when a layer() modifier is present', async () => {
      buildCtx.components = [
        mockCmp({ globalStyles: [{ styleStr: 'my-cmp { display: block; }', absolutePath: null }] }),
      ];
      const css = `@import "stencil-globals" layer(init);`;
      const result = await resolveStencilGlobalsImport(
        css,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );
      expect(result).not.toContain('@import');
      expect(result).toBe('@layer init {\nmy-cmp { display: block; }\n}');
    });

    it('wraps in @supports and @media when those modifiers are present', async () => {
      buildCtx.components = [mockCmp({ globalStyles: [{ styleStr: 'x {}', absolutePath: null }] })];
      const css = `@import "stencil-globals" supports(display: grid) (min-width: 400px);`;
      const result = await resolveStencilGlobalsImport(
        css,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );
      expect(result).toBe('@supports (display: grid) {\n@media (min-width: 400px) {\nx {}\n}\n}');
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

  describe('hasStencilCssComponentsImport', () => {
    it('detects double-quote import', () => {
      expect(hasStencilCssComponentsImport(`@import "stencil-css-components";`)).toBe(true);
    });

    it('detects single-quote import', () => {
      expect(hasStencilCssComponentsImport(`@import 'stencil-css-components';`)).toBe(true);
    });

    it('returns false when not present', () => {
      expect(hasStencilCssComponentsImport(`:root { color: red; }`)).toBe(false);
    });
  });

  describe('collectCssOnlyComponentStyles', () => {
    it('returns empty string when there are no CSS-only components', async () => {
      buildCtx.cssOnlyComponents = [];
      const result = await collectCssOnlyComponentStyles(config, compilerCtx, buildCtx);
      expect(result).toBe('');
    });

    it('reads each distinct source file once, deduping when multiple components share a file', async () => {
      buildCtx.cssOnlyComponents = [
        mockCmp({ tagName: 'my-badge', sourceFilePath: '/src/badges.css' }),
        mockCmp({ tagName: 'my-badge-group', sourceFilePath: '/src/badges.css' }),
      ];
      const readFile = vi
        .spyOn(compilerCtx.fs, 'readFile')
        .mockResolvedValue('my-badge { color: red; }');
      const result = await collectCssOnlyComponentStyles(config, compilerCtx, buildCtx);
      expect(result).toContain('my-badge');
      expect(result).toContain('color');
      expect(readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('resolveStencilCssComponentsImport', () => {
    it('replaces the import with the collected CSS-only component styles', async () => {
      buildCtx.cssOnlyComponents = [
        mockCmp({ tagName: 'my-badge', sourceFilePath: '/src/my-badge.css' }),
      ];
      vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue('my-badge { color: red; }');

      const result = await resolveStencilCssComponentsImport(
        `@import "stencil-css-components";`,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );
      expect(result).not.toContain('@import "stencil-css-components"');
      expect(result).toContain('my-badge');
      expect(result).toContain('color: red');
    });

    it('registers CSS-only component source files in cssModuleImports', async () => {
      buildCtx.cssOnlyComponents = [
        mockCmp({ tagName: 'my-badge', sourceFilePath: '/src/my-badge.css' }),
      ];
      vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue('my-badge {}');

      await resolveStencilCssComponentsImport(
        `@import "stencil-css-components";`,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );

      const imports = compilerCtx.cssModuleImports.get('/src/global.css');
      expect(imports).toContain('/src/my-badge.css');
    });
  });

  describe('generateHydrateCss', () => {
    it('returns empty string when hydratedFlag is null', () => {
      config.hydratedFlag = null;
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      expect(generateHydrateCss(config, buildCtx)).toBe('');
    });

    it('excludes CSS-only components from the hydrate/FOUC selector list', () => {
      config.hydratedFlag = {
        selector: 'class',
        name: 'hydrated',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      };
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      buildCtx.cssOnlyComponents = [mockCmp({ tagName: 'my-badge' })];
      const result = generateHydrateCss(config, buildCtx);
      expect(result).toContain('my-cmp');
      expect(result).not.toContain('my-badge');
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

  describe('replaceStencilHydrateImport', () => {
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
      const result = replaceStencilHydrateImport(css, generateHydrateCss(config, buildCtx));
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
      const result = replaceStencilHydrateImport(css, generateHydrateCss(config, buildCtx));
      expect((result.match(/@import "stencil-hydrate"/g) ?? []).length).toBe(0);
    });

    it('produces empty replacement when hydratedFlag is null', () => {
      config.hydratedFlag = null;
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      const css = `body {}\n@import "stencil-hydrate";`;
      const result = replaceStencilHydrateImport(css, generateHydrateCss(config, buildCtx));
      expect(result).not.toContain('@import "stencil-hydrate"');
      expect(result).toContain('body {}');
    });

    it('wraps in @layer when a layer() modifier is present', () => {
      config.hydratedFlag = {
        selector: 'class',
        name: 'hydrated',
        property: 'visibility',
        initialValue: 'hidden',
        hydratedValue: 'inherit',
      };
      buildCtx.components = [mockCmp({ tagName: 'my-cmp' })];
      const css = `@import "stencil-hydrate" layer(init);`;
      const result = replaceStencilHydrateImport(css, generateHydrateCss(config, buildCtx));
      expect(result).not.toContain('@import');
      expect(result).toBe(
        '@layer init {\nmy-cmp{visibility:hidden}.hydrated{visibility:inherit}\n}',
      );
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
    hasVdomPropOrAttrPrefix: false,
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

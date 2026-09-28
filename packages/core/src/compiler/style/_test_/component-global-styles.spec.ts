import { describe, expect, it, beforeEach, vi } from 'vitest';
import type * as d from '@stencil/core';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import {
  collectAndBuildComponentGlobalStyles,
  collectCssOnlyComponentStyles,
  findStencilVirtualImports,
  generateHydrateCss,
  getAnchoredHydrateCss,
  getHydrateAnchor,
  hasStencilCssComponentsImport,
  hasStencilGlobalsImport,
  hasStencilHydrateImport,
  insertBeforeStencilImport,
  replaceStencilCssComponentsImport,
  replaceStencilGlobalsImport,
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
      expect(hasStencilGlobalsImport(`@import "stencil-component-globals";`)).toBe(true);
    });

    it('detects single-quote import', () => {
      expect(hasStencilGlobalsImport(`@import 'stencil-component-globals';`)).toBe(true);
    });

    it('detects url() form', () => {
      expect(hasStencilGlobalsImport(`@import url("stencil-component-globals");`)).toBe(true);
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
    it('replaces @import "stencil-component-globals" with collected styles', async () => {
      buildCtx.components = [
        mockCmp({ globalStyles: [{ styleStr: 'my-cmp { display: block; }', absolutePath: null }] }),
      ];
      const css = `:root { --token: red; }\n@import "stencil-component-globals";\nbody { margin: 0; }`;
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
      expect(result).not.toContain('@import "stencil-component-globals"');
    });

    it('replaces url() form', async () => {
      buildCtx.components = [
        mockCmp({ globalStyles: [{ styleStr: 'my-cmp { display: block; }', absolutePath: null }] }),
      ];
      const css = `@import url("stencil-component-globals");`;
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
      const css = `@import "stencil-component-globals";\nbody {}\n@import "stencil-component-globals";`;
      const result = await resolveStencilGlobalsImport(
        css,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );
      const count = (result.match(/@import "stencil-component-globals"/g) || []).length;
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
        `@import "stencil-component-globals";`,
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
      const css = `:root {}\n@import "stencil-component-globals";\nbody {}`;
      const result = await resolveStencilGlobalsImport(
        css,
        config,
        compilerCtx,
        buildCtx,
        '/src/global.css',
      );
      expect(result).not.toContain('@import "stencil-component-globals"');
      expect(result).toContain(':root {}');
      expect(result).toContain('body {}');
    });

    it('wraps in @layer when a layer() modifier is present', async () => {
      buildCtx.components = [
        mockCmp({ globalStyles: [{ styleStr: 'my-cmp { display: block; }', absolutePath: null }] }),
      ];
      const css = `@import "stencil-component-globals" layer(init);`;
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
      const css = `@import "stencil-component-globals" supports(display: grid) (min-width: 400px);`;
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

  describe('hydrate anchor', () => {
    const hydratedFlag = {
      name: 'hydrated',
      selector: 'class',
      property: 'visibility',
      initialValue: 'hidden',
      hydratedValue: 'inherit',
    } as const;

    beforeEach(() => {
      config.hydratedFlag = hydratedFlag;
      buildCtx.components = [mockCmp({ tagName: 'cmp-a' })];
    });

    it('is component globals when any component declares a global style', () => {
      buildCtx.components.push(
        mockCmp({ tagName: 'cmp-b', globalStyles: [{ styleStr: 'x{}', absolutePath: null }] }),
      );
      buildCtx.cssOnlyComponents = [mockCmp({ tagName: 'css-badge' })];

      expect(getHydrateAnchor(buildCtx)).toBe('stencil-component-globals');
    });

    it('is CSS-only components when there are no component globals', () => {
      buildCtx.cssOnlyComponents = [mockCmp({ tagName: 'css-badge' })];

      expect(getHydrateAnchor(buildCtx)).toBe('stencil-css-components');
    });

    it('is nothing when there are neither - the loader keeps injecting at runtime', () => {
      expect(getHydrateAnchor(buildCtx)).toBeUndefined();
      expect(getAnchoredHydrateCss(config, buildCtx)).toBe('');
    });

    it('carries the FOUC css when there is an anchor', () => {
      buildCtx.cssOnlyComponents = [mockCmp({ tagName: 'css-badge' })];

      expect(getAnchoredHydrateCss(config, buildCtx)).toBe(
        'cmp-a{visibility:hidden}.hydrated{visibility:inherit}',
      );
    });

    it('carries nothing when prehydration hiding is off', () => {
      buildCtx.cssOnlyComponents = [mockCmp({ tagName: 'css-badge' })];
      config.invisiblePrehydration = false;

      expect(getAnchoredHydrateCss(config, buildCtx)).toBe('');
    });
  });

  describe('insertBeforeStencilImport', () => {
    it('inserts before the first import, outside its modifiers', () => {
      const css = ':root{}\n@import "stencil-component-globals" layer(g);\nx{}';

      expect(insertBeforeStencilImport(css, 'stencil-component-globals', 'h{}')).toBe(
        ':root{}\nh{}\n@import "stencil-component-globals" layer(g);\nx{}',
      );
    });

    it('leaves CSS without that import unchanged', () => {
      expect(insertBeforeStencilImport('x{}', 'stencil-css-components', 'h{}')).toBe('x{}');
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

  describe('virtual import syntax', () => {
    // every form CSS allows or a preprocessor emits (Sass compressed output drops the space)
    const forms = [
      '@import "stencil-component-globals";',
      "@import 'stencil-component-globals';",
      '@import url("stencil-component-globals");',
      "@import url('stencil-component-globals');",
      '@import url(stencil-component-globals);',
      '@import url( "stencil-component-globals" );',
      '@import"stencil-component-globals";',
    ];

    it.each(forms)('resolves and detects %s', (form) => {
      const css = `${form}\n:root{}`;

      expect(findStencilVirtualImports(css)).toEqual(new Set(['stencil-component-globals']));
      expect(replaceStencilGlobalsImport(css, 'x{}')).toBe('x{}\n:root{}');
    });

    it.each([
      '@import "stencil-component-globals" layer(init);',
      '@import url(stencil-component-globals) layer(init);',
      '@import"stencil-component-globals"layer(init);',
    ])('keeps the layer() modifier on %s', (form) => {
      expect(replaceStencilGlobalsImport(form, 'x{}')).toBe(
        replaceStencilGlobalsImport('@import "stencil-component-globals" layer(init);', 'x{}'),
      );
      expect(replaceStencilGlobalsImport(form, 'x{}')).toContain('@layer init');
    });

    it('resolves each virtual import independently', () => {
      const css = '@import url(stencil-hydrate);@import"stencil-css-components";';

      expect(findStencilVirtualImports(css)).toEqual(
        new Set(['stencil-hydrate', 'stencil-css-components']),
      );
      expect(replaceStencilHydrateImport(css, 'h{}')).toBe('h{}@import"stencil-css-components";');
      expect(replaceStencilCssComponentsImport(css, 'c{}')).toBe(
        '@import url(stencil-hydrate);c{}',
      );
    });

    it.each([
      '/* see stencil-component-globals */',
      '@import "stencil-component-globals-extra";',
      '@import url(stencil-component-globals-extra);',
      '@importstencil-component-globals;',
    ])('ignores %s', (css) => {
      expect(findStencilVirtualImports(css)).toEqual(new Set());
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

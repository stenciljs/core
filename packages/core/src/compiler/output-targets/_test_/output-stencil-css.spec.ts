import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as d from '@stencil/core';

import { mockCompilerSystem, mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { ASSETS, GLOBAL_STYLE, LOADER_BUNDLE, STANDALONE, WWW } from '../../../utils';
import * as componentGlobalStyles from '../../style/component-global-styles';
import {
  collectStencilCss,
  getExplicitStencilImports,
  getStencilCssMergeTarget,
  mergeStencilCss,
  outputStencilCss,
} from '../output-stencil-css';

const withGlobals = (tagName: string) =>
  ({
    tagName,
    globalStyles: [{ styleStr: `${tagName}{display:block}`, absolutePath: null }],
  }) as d.ComponentCompilerMeta;

const HYDRATE_CSS = 'my-cmp{visibility:hidden}.hydrated{visibility:inherit}';
const GLOBALS_CSS = ':root{--from-cmp:1}';
const CSS_ONLY_CSS = 'css-badge{color:red}';

describe('output-stencil-css', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  const globalStyle = (input: string, fileName = 'global.css'): d.OutputTargetGlobalStyle => ({
    type: GLOBAL_STYLE,
    input,
    dir: '/dist/assets',
    fileName,
    copyToLoaderBrowser: false,
    skipInDev: false,
  });

  const rebuild = () => {
    const ctx = mockBuildCtx(config, compilerCtx);
    ctx.isRebuild = true;
    return ctx;
  };

  beforeEach(() => {
    config = mockValidatedConfig({ fsNamespace: 'test-app', sys: mockCompilerSystem() });
    config.outputTargets = [{ type: ASSETS, dir: '/dist/assets' }];
    // keep CSS verbatim - optimization is covered by the test/build/global-style matrix
    config.autoprefixCss = false;
    config.minifyCss = false;
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
    vi.spyOn(compilerCtx.fs, 'writeFile');
    vi.spyOn(componentGlobalStyles, 'generateHydrateCss').mockReturnValue(HYDRATE_CSS);
    vi.spyOn(componentGlobalStyles, 'collectAndBuildComponentGlobalStyles').mockResolvedValue(
      GLOBALS_CSS,
    );
    vi.spyOn(componentGlobalStyles, 'collectCssOnlyComponentStyles').mockResolvedValue(
      CSS_ONLY_CSS,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getExplicitStencilImports', () => {
    it('returns nothing when there are no global-style outputs', async () => {
      expect(await getExplicitStencilImports(config, compilerCtx, buildCtx)).toEqual(new Set());
    });

    it('returns only the imports present', async () => {
      await compilerCtx.fs.writeFile('/src/global.css', '@import "stencil-component-globals";');
      config.outputTargets.push(globalStyle('/src/global.css'));

      const found = await getExplicitStencilImports(config, compilerCtx, buildCtx);

      expect(found).toEqual(new Set(['stencil-component-globals']));
      expect(found.has('stencil-hydrate')).toBe(false);
    });

    it('returns nothing when a global-style output has no input', async () => {
      config.outputTargets.push({ type: GLOBAL_STYLE } as d.OutputTargetGlobalStyle);

      expect(await getExplicitStencilImports(config, compilerCtx, buildCtx)).toEqual(new Set());
    });

    it('collects imports across every global-style input', async () => {
      await compilerCtx.fs.writeFile(
        '/src/a.css',
        '@import "stencil-hydrate";\n@import "stencil-component-globals";',
      );
      await compilerCtx.fs.writeFile('/src/b.css', '@import "stencil-css-components" layer(cmps);');
      config.outputTargets.push(
        globalStyle('/src/a.css', 'a.css'),
        globalStyle('/src/b.css', 'b.css'),
      );

      expect(await getExplicitStencilImports(config, compilerCtx, buildCtx)).toEqual(
        new Set(['stencil-hydrate', 'stencil-component-globals', 'stencil-css-components']),
      );
    });

    it.each(['stencil-hydrate', 'stencil-component-globals', 'stencil-css-components'])(
      'sees @import "%s" inside a partial',
      async (name) => {
        await compilerCtx.fs.writeFile('/src/global.css', "@import './partials/base.css';");
        await compilerCtx.fs.writeFile('/src/partials/base.css', `@import "${name}";`);
        config.outputTargets.push(globalStyle('/src/global.css'));

        expect(await getExplicitStencilImports(config, compilerCtx, buildCtx)).toEqual(
          new Set([name]),
        );
      },
    );

    it('ignores a mention that is not an @import statement', async () => {
      await compilerCtx.fs.writeFile(
        '/src/global.css',
        '/* see stencil-component-globals docs */ :root{}',
      );
      config.outputTargets.push(globalStyle('/src/global.css'));

      expect(await getExplicitStencilImports(config, compilerCtx, buildCtx)).toEqual(new Set());
    });

    it('ignores unreadable inputs', async () => {
      config.outputTargets.push(globalStyle('/src/missing.css'));

      expect(await getExplicitStencilImports(config, compilerCtx, buildCtx)).toEqual(new Set());
    });
  });

  describe('collectStencilCss', () => {
    const css = async () =>
      (await collectStencilCss(config, compilerCtx, buildCtx)).map((p) => p.css);

    it('includes component globals then CSS-only components', async () => {
      expect(await css()).toEqual([GLOBALS_CSS, CSS_ONLY_CSS]);
    });

    it('leads with FOUC-prevention CSS when there is a standalone output', async () => {
      config.outputTargets.push({ type: STANDALONE });

      expect(await css()).toEqual([HYDRATE_CSS, GLOBALS_CSS, CSS_ONLY_CSS]);
    });

    it('omits FOUC-prevention CSS when invisiblePrehydration is disabled', async () => {
      config.outputTargets.push({ type: STANDALONE });
      config.invisiblePrehydration = false;

      expect(await css()).toEqual([GLOBALS_CSS, CSS_ONLY_CSS]);
    });

    it('omits anything a global-style input already imports', async () => {
      await compilerCtx.fs.writeFile('/src/global.css', '@import "stencil-component-globals";');
      config.outputTargets.push(globalStyle('/src/global.css'));

      expect(await css()).toEqual([CSS_ONLY_CSS]);
    });

    it('places FOUC css first when its anchor is auto-placed, even without standalone', async () => {
      buildCtx.components = [withGlobals('my-cmp')];

      expect(await css()).toEqual([HYDRATE_CSS, GLOBALS_CSS, CSS_ONLY_CSS]);
    });

    it('leaves FOUC css to the input that places its anchor', async () => {
      buildCtx.components = [withGlobals('my-cmp')];
      await compilerCtx.fs.writeFile('/src/global.css', '@import "stencil-component-globals";');
      config.outputTargets.push(globalStyle('/src/global.css'));

      expect(await css()).toEqual([CSS_ONLY_CSS]);
    });

    it('omits empty parts', async () => {
      vi.mocked(componentGlobalStyles.collectAndBuildComponentGlobalStyles).mockResolvedValue('');

      expect(await css()).toEqual([CSS_ONLY_CSS]);
    });
  });

  describe('getStencilCssMergeTarget', () => {
    it('returns the only global-style target, whatever its file name', () => {
      const target = globalStyle('/src/global.css', 'whatever.css');
      config.outputTargets.push(target);

      expect(getStencilCssMergeTarget(config)).toBe(target);
    });

    it('returns nothing with no global-style targets', () => {
      expect(getStencilCssMergeTarget(config)).toBeUndefined();
    });

    it('returns nothing with several global-style targets', () => {
      config.outputTargets.push(
        globalStyle('/src/a.css', 'a.css'),
        globalStyle('/src/b.css', 'b.css'),
      );

      expect(getStencilCssMergeTarget(config)).toBeUndefined();
    });
  });

  describe('mergeStencilCss', () => {
    it('prepends the generated CSS so the target CSS wins the cascade', async () => {
      const target = globalStyle('/src/global.css', 'test-app.css');

      expect(await mergeStencilCss(config, compilerCtx, buildCtx, target, ':root{}')).toBe(
        [GLOBALS_CSS, CSS_ONLY_CSS, ':root{}'].join('\n'),
      );
    });

    it('replaces a queued target-only HMR patch with the combined CSS', async () => {
      config.devServer = { reloadStrategy: 'hmr' };
      const target = globalStyle('/src/global.css', 'test-app.css');
      await mergeStencilCss(config, compilerCtx, buildCtx, target, ':root{}');

      const ctx = rebuild();
      ctx.globalStylesUpdated.push({ fileName: 'test-app.css', styleText: ':root{--x:1}' });
      await mergeStencilCss(config, compilerCtx, ctx, target, ':root{--x:1}');

      expect(ctx.globalStylesUpdated).toEqual([
        {
          fileName: 'test-app.css',
          styleText: [GLOBALS_CSS, CSS_ONLY_CSS, ':root{--x:1}'].join('\n'),
        },
      ]);
    });

    it('queues an HMR patch when only the generated CSS changed', async () => {
      config.devServer = { reloadStrategy: 'hmr' };
      const target = globalStyle('/src/global.css', 'test-app.css');
      await mergeStencilCss(config, compilerCtx, buildCtx, target, ':root{}');

      vi.mocked(componentGlobalStyles.collectCssOnlyComponentStyles).mockResolvedValue(
        'css-badge{color:blue}',
      );
      const ctx = rebuild();
      await mergeStencilCss(config, compilerCtx, ctx, target, ':root{}');

      expect(ctx.globalStylesUpdated).toEqual([
        { fileName: 'test-app.css', styleText: expect.stringContaining('color:blue') },
      ]);
    });
  });

  describe('outputStencilCss', () => {
    it('writes {fsNamespace}.css to the assets dir and records it on the build', async () => {
      await outputStencilCss(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        '/dist/assets/test-app.css',
        [GLOBALS_CSS, CSS_ONLY_CSS].join('\n'),
        expect.anything(),
      );
      expect(buildCtx.stencilCssFile).toBe('/dist/assets/test-app.css');
    });

    it('copies to www build dirs but not the loader-bundle', async () => {
      config.outputTargets.push(
        { type: LOADER_BUNDLE, buildDir: '/dist/loader-bundle' } as d.OutputTargetLoaderBundle,
        { type: WWW, buildDir: '/www/build' } as d.OutputTargetWww,
      );

      await outputStencilCss(config, compilerCtx, buildCtx);

      expect(vi.mocked(compilerCtx.fs.writeFile).mock.calls.map((c) => c[0])).toEqual([
        '/dist/assets/test-app.css',
        '/www/build/test-app.css',
      ]);
    });

    it('only writes the www copy for a www-only project', async () => {
      config.outputTargets.push({ type: WWW, buildDir: '/www/build' } as d.OutputTargetWww);

      await outputStencilCss(config, compilerCtx, buildCtx);

      expect(vi.mocked(compilerCtx.fs.writeFile).mock.calls.map((c) => c[0])).toEqual([
        '/www/build/test-app.css',
      ]);
      expect(buildCtx.stencilCssFile).toBeUndefined();
    });

    it('leaves a single global-style target to merge it', async () => {
      config.outputTargets.push(globalStyle('/src/global.css'));

      await outputStencilCss(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).not.toHaveBeenCalled();
      expect(buildCtx.diagnostics).toEqual([]);
    });

    it('errors per un-imported part when there are several global-style targets', async () => {
      await compilerCtx.fs.writeFile('/src/a.css', '@import "stencil-component-globals";');
      await compilerCtx.fs.writeFile('/src/b.css', ':root{}');
      config.outputTargets.push(
        globalStyle('/src/a.css', 'a.css'),
        globalStyle('/src/b.css', 'b.css'),
      );

      await outputStencilCss(config, compilerCtx, buildCtx);

      expect(buildCtx.stencilCssFile).toBeUndefined();
      expect(buildCtx.diagnostics).toHaveLength(1);
      expect(buildCtx.diagnostics[0].level).toBe('error');
      expect(buildCtx.diagnostics[0].messageText).toContain('@import "stencil-css-components"');
    });

    it('does not report stencil-hydrate separately when it follows an anchor', async () => {
      buildCtx.components = [withGlobals('my-cmp')];
      await compilerCtx.fs.writeFile('/src/a.css', ':root{}');
      await compilerCtx.fs.writeFile('/src/b.css', ':root{}');
      config.outputTargets.push(
        globalStyle('/src/a.css', 'a.css'),
        globalStyle('/src/b.css', 'b.css'),
      );

      await outputStencilCss(config, compilerCtx, buildCtx);

      const messages = buildCtx.diagnostics.map((d) => d.messageText).join('\n');
      expect(messages).toContain('@import "stencil-component-globals"');
      expect(messages).not.toContain('@import "stencil-hydrate"');
    });

    it('does not error when the import is inside a partial of one of several targets', async () => {
      await compilerCtx.fs.writeFile('/src/a.css', "@import './partials/base.css';");
      await compilerCtx.fs.writeFile(
        '/src/partials/base.css',
        '@import "stencil-component-globals";\n@import "stencil-css-components";',
      );
      await compilerCtx.fs.writeFile('/src/b.css', ':root{}');
      config.outputTargets.push(
        globalStyle('/src/a.css', 'a.css'),
        globalStyle('/src/b.css', 'b.css'),
      );

      await outputStencilCss(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics).toEqual([]);
    });

    it('does not error with several global-style targets when there is nothing to place', async () => {
      vi.mocked(componentGlobalStyles.collectAndBuildComponentGlobalStyles).mockResolvedValue('');
      vi.mocked(componentGlobalStyles.collectCssOnlyComponentStyles).mockResolvedValue('');
      await compilerCtx.fs.writeFile('/src/a.css', ':root{}');
      await compilerCtx.fs.writeFile('/src/b.css', ':root{}');
      config.outputTargets.push(
        globalStyle('/src/a.css', 'a.css'),
        globalStyle('/src/b.css', 'b.css'),
      );

      await outputStencilCss(config, compilerCtx, buildCtx);

      expect(buildCtx.diagnostics).toEqual([]);
    });

    it('writes nothing when there is nothing to emit', async () => {
      vi.mocked(componentGlobalStyles.collectAndBuildComponentGlobalStyles).mockResolvedValue('');
      vi.mocked(componentGlobalStyles.collectCssOnlyComponentStyles).mockResolvedValue('');

      await outputStencilCss(config, compilerCtx, buildCtx);

      expect(compilerCtx.fs.writeFile).not.toHaveBeenCalled();
      expect(buildCtx.stencilCssFile).toBeUndefined();
    });

    it('pushes an HMR update only when the content changes on rebuild', async () => {
      config.devServer = { reloadStrategy: 'hmr' };
      await outputStencilCss(config, compilerCtx, buildCtx);

      const unchanged = rebuild();
      await outputStencilCss(config, compilerCtx, unchanged);
      expect(unchanged.globalStylesUpdated).toEqual([]);

      vi.mocked(componentGlobalStyles.collectCssOnlyComponentStyles).mockResolvedValue(
        'css-badge{color:blue}',
      );
      const changed = rebuild();
      await outputStencilCss(config, compilerCtx, changed);
      expect(changed.globalStylesUpdated).toEqual([
        { fileName: 'test-app.css', styleText: expect.stringContaining('color:blue') },
      ]);
    });
  });
});

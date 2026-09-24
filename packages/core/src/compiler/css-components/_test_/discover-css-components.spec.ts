import { describe, expect, it, vi } from 'vitest';
import type * as d from '@stencil/core';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { stubComponentCompilerMeta } from '../../types/_tests_/ComponentCompilerMeta.stub';
import { discoverCssOnlyComponents } from '../discover-css-components';

const CSS = `
/**
 * @component
 * A badge.
 */
my-badge {
  color: red;
}
`;

describe('discoverCssOnlyComponents', () => {
  const setup = () => {
    const config = mockValidatedConfig({ srcDir: '/src' });
    const compilerCtx = mockCompilerCtx(config);
    const buildCtx = mockBuildCtx(config, compilerCtx);
    config.sys.glob = vi.fn().mockResolvedValue(['my-badge.css']);
    vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue(CSS);
    return { config, compilerCtx, buildCtx };
  };

  it('discovers a CSS-only component on a full scan and reports a change', async () => {
    const { config, compilerCtx, buildCtx } = setup();

    const changed = await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    expect(changed).toBe(true);
    expect(buildCtx.cssOnlyComponents).toHaveLength(1);
    expect(buildCtx.cssOnlyComponents[0].tagName).toBe('my-badge');
  });

  it('does nothing when config.enableCssOnlyComponents is false', async () => {
    const { config, compilerCtx, buildCtx } = setup();
    config.enableCssOnlyComponents = false;

    const changed = await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    expect(changed).toBe(false);
    expect(buildCtx.cssOnlyComponents).toEqual([]);
    expect(config.sys.glob).not.toHaveBeenCalled();
  });

  it('on an unrelated rebuild with no CSS changes, reuses the cache and reports no change', async () => {
    const { config, compilerCtx, buildCtx } = setup();
    await discoverCssOnlyComponents(config, compilerCtx, buildCtx);
    (config.sys.glob as ReturnType<typeof vi.fn>).mockClear();

    buildCtx.isRebuild = true;
    buildCtx.requiresFullBuild = false;
    buildCtx.filesChanged = ['/src/some-other-file.tsx'];
    buildCtx.filesAdded = [];
    buildCtx.filesDeleted = [];

    const changed = await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    expect(changed).toBe(false);
    expect(buildCtx.cssOnlyComponents).toHaveLength(1);
    expect(config.sys.glob).not.toHaveBeenCalled();
  });

  it('reports a change when a relevant CSS file changes on a rebuild', async () => {
    const { config, compilerCtx, buildCtx } = setup();
    await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    buildCtx.isRebuild = true;
    buildCtx.requiresFullBuild = false;
    buildCtx.filesChanged = ['/src/my-badge.css'];
    buildCtx.filesAdded = [];
    buildCtx.filesDeleted = [];
    vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue(`
      /**
       * @component
       * An updated badge.
       */
      my-badge { color: blue; }
    `);

    const changed = await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    expect(changed).toBe(true);
    expect(buildCtx.cssOnlyComponents[0].docs.text).toBe('An updated badge.');
  });

  it('reports a change when a tag is renamed within an existing file', async () => {
    const { config, compilerCtx, buildCtx } = setup();
    await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    buildCtx.isRebuild = true;
    buildCtx.requiresFullBuild = false;
    buildCtx.filesChanged = ['/src/my-badge.css'];
    buildCtx.filesAdded = [];
    buildCtx.filesDeleted = [];
    vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue(`
      /** @component */
      my-badge-v2 { color: blue; }
    `);

    const changed = await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    expect(changed).toBe(true);
    expect(buildCtx.cssOnlyComponents.map((c) => c.tagName)).toEqual(['my-badge-v2']);
  });

  it('reports a change when a css-only component file is deleted', async () => {
    const { config, compilerCtx, buildCtx } = setup();
    await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    buildCtx.isRebuild = true;
    buildCtx.requiresFullBuild = false;
    buildCtx.filesChanged = [];
    buildCtx.filesAdded = [];
    buildCtx.filesDeleted = ['/src/my-badge.css'];

    const changed = await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    expect(changed).toBe(true);
    expect(buildCtx.cssOnlyComponents).toEqual([]);
  });

  it('drops a CSS-only component that collides with a real component tag and reports a diagnostic', async () => {
    const { config, compilerCtx, buildCtx } = setup();
    buildCtx.components = [stubComponentCompilerMeta({ tagName: 'my-badge' })];

    await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

    expect(buildCtx.cssOnlyComponents).toEqual([]);
    expect(buildCtx.diagnostics.some((d: d.Diagnostic) => d.level === 'error')).toBe(true);
  });

  describe('preprocessing', () => {
    // a fake sass-like plugin, standing in for `@stencil/sass`: compiles `$color` variables and
    // reports the file it inlined as a dependency, same shape a real preprocessor plugin returns
    const fakeSassPlugin = (): d.Plugin => ({
      name: 'fake-sass',
      pluginType: 'css',
      transform(sourceText, id) {
        if (!id.endsWith('.scss')) return null;
        return {
          code: sourceText.replace('$badge-color', 'red'),
          id,
          dependencies: ['/src/_variables.scss'],
        };
      },
    });

    it('runs a non-.css file through configured plugins before parsing', async () => {
      const { config, compilerCtx, buildCtx } = setup();
      config.plugins = [fakeSassPlugin()];
      config.sys.glob = vi.fn().mockResolvedValue(['my-badge.scss']);
      vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue(`
        /** @component */
        my-badge { color: $badge-color; }
      `);

      const changed = await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

      expect(changed).toBe(true);
      expect(buildCtx.cssOnlyComponents).toHaveLength(1);
      expect(buildCtx.cssOnlyComponents[0].tagName).toBe('my-badge');
    });

    it('watches dependencies reported by the preprocessing plugin', async () => {
      const { config, compilerCtx, buildCtx } = setup();
      config.plugins = [fakeSassPlugin()];
      config.sys.glob = vi.fn().mockResolvedValue(['my-badge.scss']);
      vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue(`
        /** @component */
        my-badge { color: $badge-color; }
      `);
      const addWatchFileSpy = vi.spyOn(compilerCtx, 'addWatchFile');

      await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

      expect(addWatchFileSpy).toHaveBeenCalledWith('/src/_variables.scss');
    });

    it('reports a parse diagnostic for an unrecognized extension with no matching plugin', async () => {
      const { config, compilerCtx, buildCtx } = setup();
      config.sys.glob = vi.fn().mockResolvedValue(['my-badge.scss']);
      vi.spyOn(compilerCtx.fs, 'readFile').mockResolvedValue(`
        /** @component */
        my-badge { color: $badge-color }}}
      `);

      await discoverCssOnlyComponents(config, compilerCtx, buildCtx);

      expect(buildCtx.cssOnlyComponents).toEqual([]);
      expect(buildCtx.diagnostics.some((d: d.Diagnostic) => d.level === 'error')).toBe(true);
    });
  });
});

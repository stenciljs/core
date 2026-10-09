import * as d from '@stencil/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockValidatedConfig } from '../../../testing';
import { mockBuildCtx, mockCompilerCtx } from '../../../testing/compiler';
import { join } from '../../../utils';
import { stubComponentCompilerMeta } from '../../types/_tests_/ComponentCompilerMeta.stub';
import { writeExportMaps } from '../write-export-maps';

describe('writeExportMaps', () => {
  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let buildCtx: d.BuildCtx;

  const loaderBundleTarget: d.OutputTargetLoaderBundle = {
    type: 'loader-bundle',
    dir: '/dist',
    buildDir: '/dist',
    copy: [],
    empty: true,
    cjs: true,
    skipInDev: false,
  };
  const standaloneTarget: d.OutputTargetStandalone = {
    type: 'standalone',
    dir: '/dist/components',
  };
  const typesTarget: d.OutputTargetTypes = {
    type: 'types',
    dir: '/dist/types',
    empty: true,
    skipInDev: true,
  };

  const writePackageJson = (pkg: object | string) =>
    compilerCtx.fs.writeFile(
      config.packageJsonFilePath,
      typeof pkg === 'string' ? pkg : JSON.stringify(pkg, null, 2) + '\n',
    );

  const readPackageJson = async () => await compilerCtx.fs.readFile(config.packageJsonFilePath);

  const run = async (pkg: object | string = { name: 'my-lib' }) => {
    await writePackageJson(pkg);
    await writeExportMaps(config, compilerCtx, buildCtx);
    return JSON.parse(await readPackageJson()).exports;
  };

  beforeEach(() => {
    config = mockValidatedConfig({ rootDir: '/' });
    config.packageJsonFilePath = '/package.json';
    compilerCtx = mockCompilerCtx(config);
    buildCtx = mockBuildCtx(config, compilerCtx);
  });

  it('should not touch package.json if there are no output targets', async () => {
    expect(await run()).toBeUndefined();
  });

  it('should not throw if there is no package.json', async () => {
    config.outputTargets = [loaderBundleTarget, typesTarget];
    await expect(writeExportMaps(config, compilerCtx, buildCtx)).resolves.toBeUndefined();
  });

  it('should generate the default exports for the lazy build if present, without a src/index.ts', async () => {
    config.outputTargets = [loaderBundleTarget, typesTarget];

    // Without src/index.ts, dist/index.js is just an empty auto-generated stub -
    // the root export falls back to the loader script itself, same as "./loader"
    const loaderEntry = {
      types: './dist/types/loader.d.ts',
      import: './dist/esm/loader.js',
      require: './dist/cjs/loader.cjs',
    };
    expect(await run()).toEqual({
      '.': loaderEntry,
      './loader': loaderEntry,
      './components': { types: './dist/types/components.d.ts' },
    });
  });

  it('should generate an index.js root export for the lazy build when src/index.ts exists', async () => {
    config.outputTargets = [loaderBundleTarget, typesTarget];
    await compilerCtx.fs.writeFile(
      join(config.srcDir, 'index.ts'),
      'export * from "./components";',
    );

    expect((await run())['.']).toEqual({
      types: './dist/types/index.d.ts',
      import: './dist/index.js',
      require: './dist/index.cjs',
    });
  });

  it('should generate the default exports for the custom elements build if present', async () => {
    config.outputTargets = [standaloneTarget, typesTarget];

    expect(await run()).toEqual({
      '.': { types: './dist/types/standalone.d.ts', import: './dist/components/index.js' },
      './standalone': {
        types: './dist/components/index.d.ts',
        import: './dist/components/index.js',
      },
      './components': { types: './dist/types/components.d.ts' },
    });
  });

  it('should generate the custom elements exports for multiple components', async () => {
    config.outputTargets = [standaloneTarget, typesTarget];
    buildCtx.components = [
      stubComponentCompilerMeta({ tagName: 'my-component', componentClassName: 'MyComponent' }),
      stubComponentCompilerMeta({
        tagName: 'my-other-component',
        componentClassName: 'MyOtherComponent',
      }),
    ];

    const exportMap = await run();

    expect(exportMap['./my-component']).toEqual({
      types: './dist/components/my-component.d.ts',
      import: './dist/components/my-component.js',
    });
    expect(exportMap['./my-other-component']).toEqual({
      types: './dist/components/my-other-component.d.ts',
      import: './dist/components/my-other-component.js',
    });
  });

  it('should generate the ssr export if the output target is present', async () => {
    config.outputTargets = [{ type: 'ssr', dir: '/dist/ssr', cjs: true } as d.OutputTargetSsr];

    expect(await run()).toEqual({
      './ssr': {
        types: './dist/ssr/index.d.ts',
        import: './dist/ssr/index.js',
        require: './dist/ssr/index.cjs',
      },
    });
  });

  it('should write `types` before the other conditions', async () => {
    config.outputTargets = [loaderBundleTarget, typesTarget];

    const exportMap = await run({
      exports: { './loader': { import: './old.js', node: './node.js', types: './old.d.ts' } },
    });

    expect(Object.keys(exportMap['./loader'])).toEqual(['types', 'import', 'require', 'node']);
    expect(exportMap['./loader'].node).toBe('./node.js');
  });

  it('should remove an owned condition that is no longer generated', async () => {
    config.outputTargets = [{ ...loaderBundleTarget, cjs: false }, typesTarget];

    const exportMap = await run({
      exports: { './loader': { require: './dist/cjs/loader.cjs' } },
    });

    expect(exportMap['./loader'].require).toBeUndefined();
  });

  describe('root export', () => {
    beforeEach(() => {
      config.outputTargets = [loaderBundleTarget, typesTarget];
    });

    it('should keep `import` and `types` targets that exist', async () => {
      await compilerCtx.fs.writeFile('/custom/entry.js', '');
      await compilerCtx.fs.writeFile('/custom/entry.d.ts', '');

      const exportMap = await run({
        exports: { '.': { import: './custom/entry.js', types: './custom/entry.d.ts' } },
      });

      expect(exportMap['.']).toEqual({
        types: './custom/entry.d.ts',
        import: './custom/entry.js',
      });
    });

    it('should replace `import` and `types` targets that do not exist', async () => {
      const exportMap = await run({
        exports: { '.': { import: './gone.js', types: './gone.d.ts' } },
      });

      expect(exportMap['.']).toEqual({
        types: './dist/types/loader.d.ts',
        import: './dist/esm/loader.js',
        require: './dist/cjs/loader.cjs',
      });
    });

    it('should replace an `import` target pointing at the empty loader-bundle index', async () => {
      await compilerCtx.fs.writeFile('/dist/index.js', '');

      const exportMap = await run({ exports: { '.': { import: './dist/index.js' } } });

      expect(exportMap['.']).toEqual({
        types: './dist/types/loader.d.ts',
        import: './dist/esm/loader.js',
        require: './dist/cjs/loader.cjs',
      });
    });

    it('should replace a string target pointing at the empty loader-bundle index', async () => {
      await compilerCtx.fs.writeFile('/dist/index.js', '');

      expect((await run({ exports: './dist/index.js' }))['.']).toEqual({
        types: './dist/types/loader.d.ts',
        import: './dist/esm/loader.js',
        require: './dist/cjs/loader.cjs',
      });
    });

    it('should keep an `import` target pointing at the loader-bundle index when src/index.ts exists', async () => {
      await compilerCtx.fs.writeFile('/dist/index.js', '');
      await compilerCtx.fs.writeFile(join(config.srcDir, 'index.ts'), '');

      const exportMap = await run({ exports: { '.': { import: './dist/index.js' } } });

      expect(exportMap['.'].import).toBe('./dist/index.js');
    });

    it('should keep a string target that exists', async () => {
      await compilerCtx.fs.writeFile('/custom/entry.js', '');

      expect((await run({ exports: './custom/entry.js' }))['.']).toBe('./custom/entry.js');
    });

    it('should keep nested conditions', async () => {
      const nested = { types: './a.d.ts', default: './a.js' };

      const exportMap = await run({ exports: { '.': { import: nested } } });

      expect(exportMap['.'].import).toEqual(nested);
    });

    it('should treat a conditions-only `exports` as the root entry', async () => {
      const exportMap = await run({ exports: { import: './gone.js', default: './fallback.js' } });

      expect(exportMap['.']).toEqual({
        types: './dist/types/loader.d.ts',
        import: './dist/esm/loader.js',
        require: './dist/cjs/loader.cjs',
        default: './fallback.js',
      });
      expect(exportMap.import).toBeUndefined();
    });
  });

  describe('stale component exports', () => {
    beforeEach(() => {
      config.outputTargets = [standaloneTarget, typesTarget];
      buildCtx.components = [
        stubComponentCompilerMeta({ tagName: 'my-component', componentClassName: 'MyComponent' }),
      ];
    });

    it('should remove the entry of a component that no longer exists', async () => {
      const exportMap = await run({
        exports: {
          './old-component': {
            types: './dist/components/old-component.d.ts',
            import: './dist/components/old-component.js',
          },
        },
      });

      expect(exportMap['./old-component']).toBeUndefined();
      expect(exportMap['./my-component']).toBeDefined();
    });

    it('should leave entries it did not generate', async () => {
      const authored = {
        './package.json': './package.json',
        './my-helpers': './dist/helpers/my-helpers.js',
        './other-name': { import: './dist/components/old-component.js' },
      };

      expect(await run({ exports: authored })).toMatchObject(authored);
    });
  });

  describe('component types', () => {
    it('should generate a types-only export for components.d.ts', async () => {
      config.outputTargets = [standaloneTarget, typesTarget];

      expect((await run())['./components']).toEqual({ types: './dist/types/components.d.ts' });
    });

    it('should follow a custom types dir', async () => {
      config.outputTargets = [loaderBundleTarget, { ...typesTarget, dir: '/build/typings' }];

      expect((await run())['./components']).toEqual({ types: './build/typings/components.d.ts' });
    });

    it('should not generate it without a types output or a distributable output', async () => {
      config.outputTargets = [standaloneTarget];
      expect((await run())['./components']).toBeUndefined();

      config.outputTargets = [{ type: 'ssr', dir: '/dist/ssr' } as d.OutputTargetSsr, typesTarget];
      expect((await run())['./components']).toBeUndefined();
    });
  });

  describe('assets', () => {
    it('should generate a wildcard export for the assets dir', async () => {
      config.outputTargets = [standaloneTarget, { type: 'assets', dir: '/dist/assets' }];

      expect((await run())['./assets/*']).toBe('./dist/assets/*');
    });

    it('should generate an export for a global stylesheet outside the assets dir', async () => {
      config.outputTargets = [
        standaloneTarget,
        { type: 'assets', dir: '/dist/assets' },
        { type: 'global-style', dir: '/dist/assets', fileName: 'my-lib.css' },
        { type: 'global-style', dir: '/dist/themes', fileName: 'dark.css' },
      ];

      const exportMap = await run();

      expect(exportMap['./assets/dark.css']).toBe('./dist/themes/dark.css');
      expect(exportMap['./assets/my-lib.css']).toBeUndefined();
    });

    it('should not generate assets exports without a distributable output', async () => {
      config.outputTargets = [
        { type: 'ssr', dir: '/dist/ssr' } as d.OutputTargetSsr,
        { type: 'assets', dir: '/dist/assets' },
      ];

      expect((await run())['./assets/*']).toBeUndefined();
    });
  });

  describe('formatting', () => {
    beforeEach(() => {
      config.outputTargets = [loaderBundleTarget, typesTarget];
    });

    it('should preserve indentation, key order and the trailing newline', async () => {
      await run('{\n\t"name": "my-lib",\n\t"exports": {},\n\t"version": "1.0.0"\n}\n');

      const output = await readPackageJson();
      expect(output.startsWith('{\n\t"name": "my-lib",\n\t"exports": {\n\t\t".": {')).toBe(true);
      expect(output.endsWith('\t"version": "1.0.0"\n}\n')).toBe(true);
    });

    it('should preserve CRLF line endings and a missing trailing newline', async () => {
      await run('{\r\n  "name": "my-lib"\r\n}');

      const output = await readPackageJson();
      expect(output.startsWith('{\r\n  "name": "my-lib",\r\n  "exports": {\r\n')).toBe(true);
      expect(output.replace(/\r\n/g, '')).not.toContain('\n');
      expect(output.endsWith('}')).toBe(true);
    });
  });
});

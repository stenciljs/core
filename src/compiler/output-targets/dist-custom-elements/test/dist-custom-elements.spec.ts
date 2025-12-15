import type * as d from '@stencil/core/declarations';
import { mockBuildCtx, mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import path from 'path';

import { BundleOptions } from '../../../bundle/bundle-interface';
import * as bundleOutputMod from '../../../bundle/bundle-output';
import * as optimizeModuleMod from '../../../optimize/optimize-module';
import { stubComponentCompilerMeta } from '../../../types/tests/ComponentCompilerMeta.stub';
import { addCustomElementInputs, bundleCustomElements } from '../index';

describe('dist-custom-elements', () => {
  it('should export plain component', () => {
    const cmpMeta = stubComponentCompilerMeta({ isPlain: true, sourceFilePath: './foo/bar.tsx', tagName: 'my-tag' });
    const buildCtx = mockBuildCtx();
    buildCtx.components = [cmpMeta];
    const bundleOpts: BundleOptions = {
      id: 'customElements',
      platform: 'client',
      inputs: {},
      loader: {},
    };
    const outputTarget: d.OutputTargetDistCustomElements = {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'single-export-module',
    };
    addCustomElementInputs(buildCtx, bundleOpts, outputTarget);
    expect(bundleOpts.loader['\x00MyTag']).toContain("export { StubCmp as MyTag } from './foo/bar.tsx';");
    expect(bundleOpts.loader['\x00core']).toContain(`export { MyTag } from '\x00MyTag';\n`);
  });

  it('should export component with a defineCustomElement function', () => {
    const cmpMeta = stubComponentCompilerMeta({ sourceFilePath: './foo/bar.tsx', tagName: 'my-tag' });
    const buildCtx = mockBuildCtx();
    buildCtx.components = [cmpMeta];
    const bundleOpts: BundleOptions = {
      id: 'customElements',
      platform: 'client',
      inputs: {},
      loader: {},
    };
    const outputTarget: d.OutputTargetDistCustomElements = {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'single-export-module',
    };
    addCustomElementInputs(buildCtx, bundleOpts, outputTarget);
    expect(bundleOpts.loader['\x00MyTag']).toContain('export const defineCustomElement = cmpDefCustomEle;');
    expect(bundleOpts.loader['\x00MyTag']).toContain(
      "import { StubCmp as $CmpMyTag, defineCustomElement as cmpDefCustomEle } from './foo/bar.tsx';",
    );
    expect(bundleOpts.loader['\x00core']).toContain(
      `export { MyTag, defineCustomElement as defineCustomElementMyTag } from '\x00MyTag';\n`,
    );
  });

  describe('minification', () => {
    let bundleOutputSpy: jest.SpyInstance;
    let optimizeModuleSpy: jest.SpyInstance;
    let mockRollupBuild: any;

    beforeEach(() => {
      // Mock the rollup build output
      mockRollupBuild = {
        generate: jest.fn().mockResolvedValue({
          output: [
            {
              type: 'chunk',
              fileName: 'index.js',
              code: 'export const test = "unminified code";',
              isEntry: true,
              map: null,
            },
          ],
        }),
      };

      // Spy on bundleOutput to return our mock build
      bundleOutputSpy = jest.spyOn(bundleOutputMod, 'bundleOutput');
      bundleOutputSpy.mockResolvedValue(mockRollupBuild);

      // Spy on optimizeModule to verify it's called with correct minify parameter
      optimizeModuleSpy = jest.spyOn(optimizeModuleMod, 'optimizeModule');
      optimizeModuleSpy.mockResolvedValue({
        output: 'const test="minified";',
        diagnostics: [],
        sourceMap: undefined,
      });
    });

    afterEach(() => {
      bundleOutputSpy.mockRestore();
      optimizeModuleSpy.mockRestore();
    });

    it('should pass minify=true to optimizeModule when outputTarget.minify is true', async () => {
      const config = mockValidatedConfig({ minifyJs: false });
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);
      buildCtx.components = [stubComponentCompilerMeta()];

      const outputTarget: d.OutputTargetDistCustomElements = {
        type: 'dist-custom-elements',
        dir: path.join(config.rootDir, 'dist'),
        customElementsExportBehavior: 'single-export-module',
        minify: true,
      };

      await bundleCustomElements(config, compilerCtx, buildCtx, outputTarget);

      expect(optimizeModuleSpy).toHaveBeenCalledWith(
        config,
        compilerCtx,
        expect.objectContaining({
          minify: true,
        }),
      );
    });

    it('should pass minify=false to optimizeModule when outputTarget.minify is false', async () => {
      const config = mockValidatedConfig({ minifyJs: true });
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);
      buildCtx.components = [stubComponentCompilerMeta()];

      const outputTarget: d.OutputTargetDistCustomElements = {
        type: 'dist-custom-elements',
        dir: path.join(config.rootDir, 'dist'),
        customElementsExportBehavior: 'single-export-module',
        minify: false,
      };

      await bundleCustomElements(config, compilerCtx, buildCtx, outputTarget);

      expect(optimizeModuleSpy).toHaveBeenCalledWith(
        config,
        compilerCtx,
        expect.objectContaining({
          minify: false,
        }),
      );
    });

    it('should fall back to config.minifyJs when outputTarget.minify is undefined', async () => {
      const config = mockValidatedConfig({ minifyJs: true });
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);
      buildCtx.components = [stubComponentCompilerMeta()];

      const outputTarget: d.OutputTargetDistCustomElements = {
        type: 'dist-custom-elements',
        dir: path.join(config.rootDir, 'dist'),
        customElementsExportBehavior: 'single-export-module',
        // minify is undefined, should use config.minifyJs
      };

      await bundleCustomElements(config, compilerCtx, buildCtx, outputTarget);

      expect(optimizeModuleSpy).toHaveBeenCalledWith(
        config,
        compilerCtx,
        expect.objectContaining({
          minify: true, // from config.minifyJs
        }),
      );
    });
  });
});

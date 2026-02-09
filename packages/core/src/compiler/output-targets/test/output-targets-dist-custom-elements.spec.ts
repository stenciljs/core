import {
  mockBuildCtx,
  mockCompilerCtx,
  mockCompilerSystem,
  mockModule,
  mockValidatedConfig,
} from '@stencil/core/testing';
import { DIST_CUSTOM_ELEMENTS } from '../../../utils';
import path from 'path';

import type * as d from '../../../declarations';
import { OutputTargetDistCustomElements } from '../../../declarations';
import { STENCIL_APP_GLOBALS_ID, STENCIL_INTERNAL_CLIENT_ID, USER_INDEX_ENTRY_ID } from '../../bundle/entry-alias-ids';
import { stubComponentCompilerMeta } from '../../types/tests/ComponentCompilerMeta.stub';
import * as outputCustomElementsMod from '../dist-custom-elements';
import {
  addCustomElementInputs,
  bundleCustomElements,
  generateEntryPoint,
  getBundleOptions,
  outputCustomElements,
} from '../dist-custom-elements';

const setup = () => {
  const sys = mockCompilerSystem();
  const config: d.ValidatedConfig = mockValidatedConfig({
    buildAppCore: true,
    buildEs5: true,
    configPath: '/testing-path',
    namespace: 'TestApp',
    outputTargets: [{ type: DIST_CUSTOM_ELEMENTS }],
    srcDir: '/src',
    sys,
  });
  const compilerCtx = mockCompilerCtx(config);
  const buildCtx = mockBuildCtx(config, compilerCtx);

  const root = config.rootDir;
  config.rootDir = path.join(root, 'User', 'testing', '/');
  config.globalScript = path.join(root, 'User', 'testing', 'src', 'global.ts');

  const bundleCustomElementsSpy = jest.spyOn(outputCustomElementsMod, 'bundleCustomElements');

  compilerCtx.moduleMap.set('test', mockModule());

  return { config, compilerCtx, buildCtx, bundleCustomElementsSpy };
};

describe('Custom Elements output target', () => {
  it('should return early if config.buildDist is false', async () => {
    const { config, compilerCtx, buildCtx, bundleCustomElementsSpy } = setup();
    config.buildDist = false;
    await outputCustomElements(config, compilerCtx, buildCtx);
    expect(bundleCustomElementsSpy).not.toHaveBeenCalled();
  });

  it.each<d.OutputTarget[][]>([[[]], [[{ type: 'dist' }]]])(
    'should return early if no appropriate output target (%j)',
    async (outputTargets) => {
      const { config, compilerCtx, buildCtx, bundleCustomElementsSpy } = setup();
      config.outputTargets = outputTargets;
      await outputCustomElements(config, compilerCtx, buildCtx);
      expect(bundleCustomElementsSpy).not.toHaveBeenCalled();
    },
  );

  describe('generateEntryPoint', () => {
    it('should include global scripts when flag is `true`', () => {
      const entryPoint = generateEntryPoint({
        type: DIST_CUSTOM_ELEMENTS,
        includeGlobalScripts: true,
      });

      expect(entryPoint).toEqual(`import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';
export { getAssetPath, setAssetPath, setNonce, setPlatformOptions, render } from '${STENCIL_INTERNAL_CLIENT_ID}';
export * from '${USER_INDEX_ENTRY_ID}';

globalScripts();
`);
    });

    it('should not include global scripts when flag is `false`', () => {
      const entryPoint = generateEntryPoint({
        type: DIST_CUSTOM_ELEMENTS,
        includeGlobalScripts: false,
      });

      expect(entryPoint)
        .toEqual(`export { getAssetPath, setAssetPath, setNonce, setPlatformOptions, render } from '${STENCIL_INTERNAL_CLIENT_ID}';
export * from '${USER_INDEX_ENTRY_ID}';
`);
    });
  });

  describe('getBundleOptions', () => {
    it('should set basic properties on BundleOptions', () => {
      const { config, buildCtx, compilerCtx } = setup();
      const options = getBundleOptions(config, buildCtx, compilerCtx, { type: DIST_CUSTOM_ELEMENTS });
      expect(options.id).toBe('customElements');
      expect(options.platform).toBe('client');
      expect(options.inlineWorkers).toBe(true);
      expect(options.inputs).toEqual({
        index: '\0core',
      });
      expect(options.loader).toEqual({});
      expect(options.preserveEntrySignatures).toEqual('allow-extension');
    });

    it.each([true, false, undefined])('should set externalRuntime correctly when %p', (externalRuntime) => {
      const { config, buildCtx, compilerCtx } = setup();
      const options = getBundleOptions(config, buildCtx, compilerCtx, {
        type: DIST_CUSTOM_ELEMENTS,
        externalRuntime,
      });
      if (externalRuntime) {
        expect(options.externalRuntime).toBe(true);
      } else {
        expect(options.externalRuntime).toBe(false);
      }
    });
  });

  describe('bundleCustomElements', () => {
    it('should set a diagnostic if no `dir` prop on the output target', async () => {
      const { config, compilerCtx, buildCtx } = setup();
      const outputTarget: OutputTargetDistCustomElements = { type: DIST_CUSTOM_ELEMENTS, externalRuntime: true };
      await bundleCustomElements(config, compilerCtx, buildCtx, outputTarget);
      expect(buildCtx.diagnostics).toEqual([
        {
          level: 'error',
          lines: [],
          type: 'build',
          messageText: 'dist-custom-elements output target provided with no output target directory!',
        },
      ]);
    });
  });

  describe('addCustomElementInputs', () => {
    let config: d.ValidatedConfig;
    let compilerCtx: d.CompilerCtx;
    let buildCtx: d.BuildCtx;

    beforeEach(() => {
      ({ config, compilerCtx, buildCtx } = setup());
    });

    describe('no defined CustomElementsExportBehavior', () => {
      it("doesn't re-export components from the index.js barrel file", () => {
        const componentOne = stubComponentCompilerMeta();
        const componentTwo = stubComponentCompilerMeta({
          componentClassName: 'MyBestComponent',
          tagName: 'my-best-component',
        });

        buildCtx.components = [componentOne, componentTwo];

        const bundleOptions = getBundleOptions(
          config,
          buildCtx,
          compilerCtx,
          config.outputTargets[0] as OutputTargetDistCustomElements,
        );
        addCustomElementInputs(buildCtx, bundleOptions, config.outputTargets[0] as OutputTargetDistCustomElements);
        expect(bundleOptions.loader['\0core']).toEqual(
          `import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';
export { getAssetPath, setAssetPath, setNonce, setPlatformOptions, render } from '${STENCIL_INTERNAL_CLIENT_ID}';
export * from '${USER_INDEX_ENTRY_ID}';

globalScripts();
`,
        );
      });
    });

    describe('CustomElementsExportBehavior.SINGLE_EXPORT_MODULE', () => {
      beforeEach(() => {
        (config.outputTargets[0] as OutputTargetDistCustomElements).customElementsExportBehavior =
          'single-export-module';
      });

      it('should add imports to index.js for all included components', () => {
        const componentOne = stubComponentCompilerMeta();
        const componentTwo = stubComponentCompilerMeta({
          componentClassName: 'MyBestComponent',
          tagName: 'my-best-component',
        });

        buildCtx.components = [componentOne, componentTwo];

        const bundleOptions = getBundleOptions(
          config,
          buildCtx,
          compilerCtx,
          config.outputTargets[0] as OutputTargetDistCustomElements,
        );
        addCustomElementInputs(buildCtx, bundleOptions, config.outputTargets[0] as OutputTargetDistCustomElements);
        expect(bundleOptions.loader['\0core']).toEqual(
          `import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';
export { getAssetPath, setAssetPath, setNonce, setPlatformOptions, render } from '${STENCIL_INTERNAL_CLIENT_ID}';
export * from '${USER_INDEX_ENTRY_ID}';
export { StubCmp, defineCustomElement as defineCustomElementStubCmp } from '\0StubCmp';
export { MyBestComponent, defineCustomElement as defineCustomElementMyBestComponent } from '\0MyBestComponent';

globalScripts();
`,
        );
      });

      it('should correctly handle capitalization edge-cases', () => {
        const component = stubComponentCompilerMeta({
          componentClassName: 'ComponentWithJSX',
          tagName: 'component-with-jsx',
        });

        buildCtx.components = [component];

        const bundleOptions = getBundleOptions(
          config,
          buildCtx,
          compilerCtx,
          config.outputTargets[0] as OutputTargetDistCustomElements,
        );
        addCustomElementInputs(buildCtx, bundleOptions, config.outputTargets[0] as OutputTargetDistCustomElements);
        expect(bundleOptions.loader['\0core']).toEqual(
          `import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';
export { getAssetPath, setAssetPath, setNonce, setPlatformOptions, render } from '${STENCIL_INTERNAL_CLIENT_ID}';
export * from '${USER_INDEX_ENTRY_ID}';
export { ComponentWithJsx, defineCustomElement as defineCustomElementComponentWithJsx } from '\0ComponentWithJsx';

globalScripts();
`,
        );
      });
    });

    describe('CustomElementsExportBehavior.BUNDLE', () => {
      beforeEach(() => {
        (config.outputTargets[0] as OutputTargetDistCustomElements).customElementsExportBehavior = 'bundle';
      });

      it('should add a `defineCustomElements` function to the index.js file', () => {
        const componentOne = stubComponentCompilerMeta();
        const componentTwo = stubComponentCompilerMeta({
          componentClassName: 'MyBestComponent',
          tagName: 'my-best-component',
        });

        buildCtx.components = [componentOne, componentTwo];

        const bundleOptions = getBundleOptions(
          config,
          buildCtx,
          compilerCtx,
          config.outputTargets[0] as OutputTargetDistCustomElements,
        );
        addCustomElementInputs(buildCtx, bundleOptions, config.outputTargets[0] as OutputTargetDistCustomElements);
        expect(bundleOptions.loader['\0core']).toEqual(
          `import { globalScripts } from '${STENCIL_APP_GLOBALS_ID}';
import { transformTag } from '@stencil/core/runtime/client';
import { StubCmp } from '\0StubCmp';
import { MyBestComponent } from '\0MyBestComponent';
export { getAssetPath, setAssetPath, setNonce, setPlatformOptions, render } from '${STENCIL_INTERNAL_CLIENT_ID}';
export * from '${USER_INDEX_ENTRY_ID}';

globalScripts();
export const defineCustomElements = (opts) => {
    if (typeof customElements !== 'undefined') {
        [
            StubCmp,
            MyBestComponent,
        ].forEach(cmp => {
            if (!customElements.get(transformTag(cmp.is))) {
                customElements.define(transformTag(cmp.is), cmp, opts);
            }
        });
    }
};
`,
        );
      });
    });

    describe('autoLoader', () => {
      it('should add a loader virtual module when autoLoader is true', () => {
        const componentOne = stubComponentCompilerMeta();
        const componentTwo = stubComponentCompilerMeta({
          componentClassName: 'MyBestComponent',
          tagName: 'my-best-component',
        });

        buildCtx.components = [componentOne, componentTwo];

        const outputTarget = config.outputTargets[0] as OutputTargetDistCustomElements;
        outputTarget.autoLoader = { fileName: 'loader', autoStart: true };

        const bundleOptions = getBundleOptions(config, buildCtx, compilerCtx, outputTarget);
        addCustomElementInputs(buildCtx, bundleOptions, outputTarget);

        // Check loader input is added
        expect(bundleOptions.inputs['loader']).toBe('\0loader');

        // Check loader module content
        const loaderContent = bundleOptions.loader['\0loader'];
        expect(loaderContent).toContain(`import { transformTag } from '${STENCIL_INTERNAL_CLIENT_ID}'`);
        expect(loaderContent).toContain("'stub-cmp': './stub-cmp.js'");
        expect(loaderContent).toContain("'my-best-component': './my-best-component.js'");
        expect(loaderContent).toContain('export function start(');
        expect(loaderContent).toContain('export function stop(');
        expect(loaderContent).toContain('start();'); // autoStart is true
      });

      it('should not auto-start when autoStart is false', () => {
        const component = stubComponentCompilerMeta();
        buildCtx.components = [component];

        const outputTarget = config.outputTargets[0] as OutputTargetDistCustomElements;
        outputTarget.autoLoader = { fileName: 'loader', autoStart: false };

        const bundleOptions = getBundleOptions(config, buildCtx, compilerCtx, outputTarget);
        addCustomElementInputs(buildCtx, bundleOptions, outputTarget);

        const loaderContent = bundleOptions.loader['\0loader'];
        // Should export start/stop but NOT auto-call start()
        expect(loaderContent).toContain('export function start(');
        expect(loaderContent).toContain('export function stop(');
        expect(loaderContent).not.toMatch(/^start\(\);$/m);
      });

      it('should use custom fileName for loader', () => {
        const component = stubComponentCompilerMeta();
        buildCtx.components = [component];

        const outputTarget = config.outputTargets[0] as OutputTargetDistCustomElements;
        outputTarget.autoLoader = { fileName: 'my-custom-loader', autoStart: true };

        const bundleOptions = getBundleOptions(config, buildCtx, compilerCtx, outputTarget);
        addCustomElementInputs(buildCtx, bundleOptions, outputTarget);

        expect(bundleOptions.inputs['my-custom-loader']).toBe('\0loader');
      });

      it('should not add loader when autoLoader is not set', () => {
        const component = stubComponentCompilerMeta();
        buildCtx.components = [component];

        const outputTarget = config.outputTargets[0] as OutputTargetDistCustomElements;
        // autoLoader is not set

        const bundleOptions = getBundleOptions(config, buildCtx, compilerCtx, outputTarget);
        addCustomElementInputs(buildCtx, bundleOptions, outputTarget);

        expect(bundleOptions.inputs['loader']).toBeUndefined();
        expect(bundleOptions.loader['\0loader']).toBeUndefined();
      });
    });
  });
});

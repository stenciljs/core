import {
  mockBuildCtx,
  mockCompilerCtx,
  mockCompilerSystem,
  mockModule,
  mockValidatedConfig,
} from '@stencil/core/testing';
import { DIST_CUSTOM_ELEMENTS, normalizePath } from '@utils';
import path from 'path';

import type * as d from '../../../declarations';
import { stubComponentCompilerMeta } from '../../types/tests/ComponentCompilerMeta.stub';
import * as outputCustomElementsMod from '../dist-custom-elements';
import { generateCustomElementsTypes } from '../dist-custom-elements/custom-elements-types';

const setup = () => {
  const sys = mockCompilerSystem();
  const config: d.ValidatedConfig = mockValidatedConfig({
    configPath: '/testing-path',
    buildAppCore: true,
    buildEs5: true,
    namespace: 'TestApp',
    outputTargets: [{ type: DIST_CUSTOM_ELEMENTS, dir: 'my-best-dir' }],
    srcDir: '/src',
    sys,
  });
  const compilerCtx = mockCompilerCtx(config);
  const buildCtx = mockBuildCtx(config, compilerCtx);

  const root = config.rootDir;
  config.rootDir = normalizePath(path.join(root, 'User', 'testing', '/'));
  config.globalScript = normalizePath(path.join(root, 'User', 'testing', 'src', 'global.ts'));

  const bundleCustomElementsSpy = jest.spyOn(outputCustomElementsMod, 'bundleCustomElements');

  compilerCtx.moduleMap.set('test', mockModule());

  return { config, compilerCtx, buildCtx, bundleCustomElementsSpy };
};

describe('Custom Elements Typedef generation', () => {
  describe('export behavior: single-export-module', () => {
    let config: d.ValidatedConfig;
    let compilerCtx: d.CompilerCtx;
    let buildCtx: d.BuildCtx;
    let writeFileSpy: jest.SpyInstance;

    beforeEach(() => {
      // this component tests the 'happy path' of a component's filename coinciding with its
      // tag name
      const componentOne = stubComponentCompilerMeta({
        tagName: 'my-component',
        sourceFilePath: '/src/components/my-component/my-component.tsx',
      });
      // this component tests that we correctly resolve its path when the component tag does
      // not match its filename
      const componentTwo = stubComponentCompilerMeta({
        sourceFilePath: '/src/components/the-other-component/my-real-best-component.tsx',
        componentClassName: 'MyBestComponent',
        tagName: 'my-best-component',
      });
      ({ config, compilerCtx, buildCtx } = setup());
      (config.outputTargets[0] as d.OutputTargetDistCustomElements).customElementsExportBehavior =
        'single-export-module';
      buildCtx.components = [componentOne, componentTwo];

      writeFileSpy = jest.spyOn(compilerCtx.fs, 'writeFile');
    });

    afterEach(() => {
      writeFileSpy.mockRestore();
    });

    it('should generate an index.d.ts file corresponding to the index.js file when outputting to a sub-dir of dist', async () => {
      await generateCustomElementsTypes(config, compilerCtx, buildCtx, 'types_dir');

      const expectedTypedefOutput = [
        '/* TestApp custom elements */',
        `export { StubCmp as MyComponent } from '../types_dir/components/my-component/my-component';`,
        `export { defineCustomElement as defineCustomElementMyComponent } from './my-component';`,
        `export { MyBestComponent as MyBestComponent } from '../types_dir/components/the-other-component/my-real-best-component';`,
        `export { defineCustomElement as defineCustomElementMyBestComponent } from './my-best-component';`,
        '',
        `/**`,
        ` * Get the base path to where the assets can be found. Use "setAssetPath(path)"`,
        ` * if the path needs to be customized.`,
        ` */`,
        `export declare const getAssetPath: (path: string) => string;`,
        '',
        '/**',
        ' * Used to manually set the base path where assets can be found.',
        ' * If the script is used as "module", it\'s recommended to use "import.meta.url",',
        ' * such as "setAssetPath(import.meta.url)". Other options include',
        ' * "setAssetPath(document.currentScript.src)", or using a bundler\'s replace plugin to',
        ' * dynamically set the path at build time, such as "setAssetPath(process.env.ASSET_PATH)".',
        ' * But do note that this configuration depends on how your script is bundled, or lack of',
        ' * bundling, and where your assets can be loaded from. Additionally custom bundling',
        ' * will have to ensure the static assets are copied to its build directory.',
        ' */',
        'export declare const setAssetPath: (path: string) => void;',
        '',
        '/**',
        ` * Used to specify a nonce value that corresponds with an application's CSP.`,
        ' * When set, the nonce will be added to all dynamically created script and style tags at runtime.',
        ' * Alternatively, the nonce value can be set on a meta tag in the DOM head',
        ' * (<meta name="csp-nonce" content="{ nonce value here }" />) which',
        ' * will result in the same behavior.',
        ' */',
        'export declare const setNonce: (nonce: string) => void',
        '',
        'export interface SetPlatformOptions {',
        '  raf?: (c: FrameRequestCallback) => number;',
        '  ael?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;',
        '  rel?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;',
        '}',
        'export declare const setPlatformOptions: (opts: SetPlatformOptions) => void;',
        "export * from '../types_dir/components';",
        '',
      ].join('\n');

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith('my-best-dir/index.d.ts', expectedTypedefOutput, {
        outputTargetType: DIST_CUSTOM_ELEMENTS,
      });
    });

    it('should generate an index.d.ts file corresponding to the index.js file when outputting to top-level of dist', async () => {
      (config.outputTargets[0] as d.OutputTargetDistCustomElements).dir = 'dist';

      await generateCustomElementsTypes(config, compilerCtx, buildCtx, 'dist/types_dir');

      const expectedTypedefOutput = [
        '/* TestApp custom elements */',
        `export { StubCmp as MyComponent } from './types_dir/components/my-component/my-component';`,
        `export { defineCustomElement as defineCustomElementMyComponent } from './my-component';`,
        `export { MyBestComponent as MyBestComponent } from './types_dir/components/the-other-component/my-real-best-component';`,
        `export { defineCustomElement as defineCustomElementMyBestComponent } from './my-best-component';`,
        '',
        `/**`,
        ` * Get the base path to where the assets can be found. Use "setAssetPath(path)"`,
        ` * if the path needs to be customized.`,
        ` */`,
        `export declare const getAssetPath: (path: string) => string;`,
        '',
        '/**',
        ' * Used to manually set the base path where assets can be found.',
        ' * If the script is used as "module", it\'s recommended to use "import.meta.url",',
        ' * such as "setAssetPath(import.meta.url)". Other options include',
        ' * "setAssetPath(document.currentScript.src)", or using a bundler\'s replace plugin to',
        ' * dynamically set the path at build time, such as "setAssetPath(process.env.ASSET_PATH)".',
        ' * But do note that this configuration depends on how your script is bundled, or lack of',
        ' * bundling, and where your assets can be loaded from. Additionally custom bundling',
        ' * will have to ensure the static assets are copied to its build directory.',
        ' */',
        'export declare const setAssetPath: (path: string) => void;',
        '',
        '/**',
        ` * Used to specify a nonce value that corresponds with an application's CSP.`,
        ' * When set, the nonce will be added to all dynamically created script and style tags at runtime.',
        ' * Alternatively, the nonce value can be set on a meta tag in the DOM head',
        ' * (<meta name="csp-nonce" content="{ nonce value here }" />) which',
        ' * will result in the same behavior.',
        ' */',
        'export declare const setNonce: (nonce: string) => void',
        '',
        'export interface SetPlatformOptions {',
        '  raf?: (c: FrameRequestCallback) => number;',
        '  ael?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;',
        '  rel?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;',
        '}',
        'export declare const setPlatformOptions: (opts: SetPlatformOptions) => void;',
        "export * from './types_dir/components';",
        '',
      ].join('\n');

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith('dist/index.d.ts', expectedTypedefOutput, {
        outputTargetType: DIST_CUSTOM_ELEMENTS,
      });
    });
  });

  it('should generate an index.d.ts file corresponding to the index.js file when barrel export behavior is disabled', async () => {
    // this component tests the 'happy path' of a component's filename coinciding with its
    // tag name
    const componentOne = stubComponentCompilerMeta({
      tagName: 'my-component',
      sourceFilePath: '/src/components/my-component/my-component.tsx',
    });
    // this component tests that we correctly resolve its path when the component tag does
    // not match its filename
    const componentTwo = stubComponentCompilerMeta({
      sourceFilePath: '/src/components/the-other-component/my-real-best-component.tsx',
      componentClassName: 'MyBestComponent',
      tagName: 'my-best-component',
    });
    const { config, compilerCtx, buildCtx } = setup();
    buildCtx.components = [componentOne, componentTwo];

    const writeFileSpy = jest.spyOn(compilerCtx.fs, 'writeFile');

    await generateCustomElementsTypes(config, compilerCtx, buildCtx, 'types_dir');

    const expectedTypedefOutput = [
      `/**`,
      ` * Get the base path to where the assets can be found. Use "setAssetPath(path)"`,
      ` * if the path needs to be customized.`,
      ` */`,
      `export declare const getAssetPath: (path: string) => string;`,
      '',
      '/**',
      ' * Used to manually set the base path where assets can be found.',
      ' * If the script is used as "module", it\'s recommended to use "import.meta.url",',
      ' * such as "setAssetPath(import.meta.url)". Other options include',
      ' * "setAssetPath(document.currentScript.src)", or using a bundler\'s replace plugin to',
      ' * dynamically set the path at build time, such as "setAssetPath(process.env.ASSET_PATH)".',
      ' * But do note that this configuration depends on how your script is bundled, or lack of',
      ' * bundling, and where your assets can be loaded from. Additionally custom bundling',
      ' * will have to ensure the static assets are copied to its build directory.',
      ' */',
      'export declare const setAssetPath: (path: string) => void;',
      '',
      '/**',
      " * Used to specify a nonce value that corresponds with an application's CSP.",
      ' * When set, the nonce will be added to all dynamically created script and style tags at runtime.',
      ' * Alternatively, the nonce value can be set on a meta tag in the DOM head',
      ' * (<meta name="csp-nonce" content="{ nonce value here }" />) which',
      ' * will result in the same behavior.',
      ' */',
      'export declare const setNonce: (nonce: string) => void',
      '',
      'export interface SetPlatformOptions {',
      '  raf?: (c: FrameRequestCallback) => number;',
      '  ael?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;',
      '  rel?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;',
      '}',
      'export declare const setPlatformOptions: (opts: SetPlatformOptions) => void;',
      '',
    ].join('\n');

    expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith('my-best-dir/index.d.ts', expectedTypedefOutput, {
      outputTargetType: DIST_CUSTOM_ELEMENTS,
    });

    writeFileSpy.mockRestore();
  });

  it('should generate a type signature for the `defineCustomElements` function when `bundle` export behavior is set', async () => {
    const componentOne = stubComponentCompilerMeta({
      tagName: 'my-component',
      sourceFilePath: '/src/components/my-component/my-component.tsx',
    });
    const componentTwo = stubComponentCompilerMeta({
      sourceFilePath: '/src/components/the-other-component/my-real-best-component.tsx',
      componentClassName: 'MyBestComponent',
      tagName: 'my-best-component',
    });
    const { config, compilerCtx, buildCtx } = setup();
    (config.outputTargets[0] as d.OutputTargetDistCustomElements).customElementsExportBehavior = 'bundle';
    buildCtx.components = [componentOne, componentTwo];

    const writeFileSpy = jest.spyOn(compilerCtx.fs, 'writeFile');

    await generateCustomElementsTypes(config, compilerCtx, buildCtx, 'types_dir');

    const expectedTypedefOutput = [
      `/**`,
      ` * Get the base path to where the assets can be found. Use "setAssetPath(path)"`,
      ` * if the path needs to be customized.`,
      ` */`,
      `export declare const getAssetPath: (path: string) => string;`,
      '',
      '/**',
      ' * Used to manually set the base path where assets can be found.',
      ' * If the script is used as "module", it\'s recommended to use "import.meta.url",',
      ' * such as "setAssetPath(import.meta.url)". Other options include',
      ' * "setAssetPath(document.currentScript.src)", or using a bundler\'s replace plugin to',
      ' * dynamically set the path at build time, such as "setAssetPath(process.env.ASSET_PATH)".',
      ' * But do note that this configuration depends on how your script is bundled, or lack of',
      ' * bundling, and where your assets can be loaded from. Additionally custom bundling',
      ' * will have to ensure the static assets are copied to its build directory.',
      ' */',
      'export declare const setAssetPath: (path: string) => void;',
      '',
      '/**',
      " * Used to specify a nonce value that corresponds with an application's CSP.",
      ' * When set, the nonce will be added to all dynamically created script and style tags at runtime.',
      ' * Alternatively, the nonce value can be set on a meta tag in the DOM head',
      ' * (<meta name="csp-nonce" content="{ nonce value here }" />) which',
      ' * will result in the same behavior.',
      ' */',
      'export declare const setNonce: (nonce: string) => void',
      '',
      'export interface SetPlatformOptions {',
      '  raf?: (c: FrameRequestCallback) => number;',
      '  ael?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;',
      '  rel?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;',
      '}',
      'export declare const setPlatformOptions: (opts: SetPlatformOptions) => void;',
      '',
      '/**',
      ` * Utility to define all custom elements within this package using the tag name provided in the component's source.`,
      ` * When defining each custom element, it will also check it's safe to define by:`,
      ' *',
      ' * 1. Ensuring the "customElements" registry is available in the global context (window).',
      ' * 2. Ensuring that the component tag name is not already defined.',
      ' *',
      ' * Use the standard [customElements.define()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define)',
      ' * method instead to define custom elements individually, or to provide a different tag name.',
      ' */',
      'export declare const defineCustomElements: (opts?: any) => void;',
      '',
    ].join('\n');

    expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith('my-best-dir/index.d.ts', expectedTypedefOutput, {
      outputTargetType: DIST_CUSTOM_ELEMENTS,
    });

    writeFileSpy.mockRestore();
  });
});

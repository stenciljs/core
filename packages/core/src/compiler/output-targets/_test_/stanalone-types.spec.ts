import path from 'path';
import {
  mockBuildCtx,
  mockCompilerCtx,
  mockCompilerSystem,
  mockModule,
  mockValidatedConfig,
} from '@stencil/core/testing';
import { describe, expect, it, beforeEach, MockInstance, vi, afterEach } from 'vitest';
import type * as d from '@stencil/core';

import { STANDALONE, normalizePath } from '../../../utils';
import { stubComponentCompilerMeta } from '../../types/_tests_/ComponentCompilerMeta.stub';
import * as outputCustomElementsMod from '../standalone';
import { generateStandaloneTypes } from '../standalone/standalone-types';

const setup = () => {
  const sys = mockCompilerSystem();
  const config: d.ValidatedConfig = mockValidatedConfig({
    configPath: '/testing-path',
    buildAppCore: true,
    namespace: 'TestApp',
    outputTargets: [{ type: STANDALONE, dir: 'my-best-dir' }],
    srcDir: '/src',
    sys,
  });
  const compilerCtx = mockCompilerCtx(config);
  const buildCtx = mockBuildCtx(config, compilerCtx);

  const root = config.rootDir;
  config.rootDir = normalizePath(path.join(root, 'User', 'testing', '/'));
  config.globalScript = normalizePath(path.join(root, 'User', 'testing', 'src', 'global.ts'));

  const bundleCustomElementsSpy = vi.spyOn(outputCustomElementsMod, 'bundleStandalone');

  compilerCtx.moduleMap.set('test', mockModule());

  return { config, compilerCtx, buildCtx, bundleCustomElementsSpy };
};

describe('Custom Elements Typedef generation', () => {
  describe('export behavior: single-export-module', () => {
    let config: d.ValidatedConfig;
    let compilerCtx: d.CompilerCtx;
    let buildCtx: d.BuildCtx;
    let writeFileSpy: MockInstance;

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
      (config.outputTargets[0] as d.OutputTargetStandalone).customElementsExportBehavior =
        'single-export-module';
      buildCtx.components = [componentOne, componentTwo];

      writeFileSpy = vi.spyOn(compilerCtx.fs, 'writeFile');
    });

    afterEach(() => {
      writeFileSpy.mockRestore();
    });

    it('should generate an index.d.ts file corresponding to the index.js file when outputting to a sub-dir of dist', async () => {
      await generateStandaloneTypes(config, compilerCtx, buildCtx, 'types_dir');

      const expectedTypedefOutput = [
        '/* TestApp custom elements */',
        `export { StubCmp as MyComponent } from '../types_dir/components/my-component/my-component';`,
        `export { defineCustomElement as defineCustomElementMyComponent } from './my-component';`,
        `export { MyBestComponent as MyBestComponent } from '../types_dir/components/the-other-component/my-real-best-component';`,
        `export { defineCustomElement as defineCustomElementMyBestComponent } from './my-best-component';`,
        '',
        `export * from '../types_dir/standalone';`,
        "export * from '../types_dir/components';",
        '',
      ].join('\n');

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        'my-best-dir/index.d.ts',
        expectedTypedefOutput,
        {
          outputTargetType: STANDALONE,
        },
      );
    });

    it('should generate an index.d.ts file corresponding to the index.js file when outputting to top-level of dist', async () => {
      (config.outputTargets[0] as d.OutputTargetStandalone).dir = 'dist';

      await generateStandaloneTypes(config, compilerCtx, buildCtx, 'dist/types_dir');

      const expectedTypedefOutput = [
        '/* TestApp custom elements */',
        `export { StubCmp as MyComponent } from './types_dir/components/my-component/my-component';`,
        `export { defineCustomElement as defineCustomElementMyComponent } from './my-component';`,
        `export { MyBestComponent as MyBestComponent } from './types_dir/components/the-other-component/my-real-best-component';`,
        `export { defineCustomElement as defineCustomElementMyBestComponent } from './my-best-component';`,
        '',
        `export * from './types_dir/standalone';`,
        "export * from './types_dir/components';",
        '',
      ].join('\n');

      expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
        'dist/index.d.ts',
        expectedTypedefOutput,
        {
          outputTargetType: STANDALONE,
        },
      );
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

    const writeFileSpy = vi.spyOn(compilerCtx.fs, 'writeFile');

    await generateStandaloneTypes(config, compilerCtx, buildCtx, 'types_dir');

    const expectedTypedefOutput = [`export * from '../types_dir/standalone';`, ''].join('\n');

    expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
      'my-best-dir/index.d.ts',
      expectedTypedefOutput,
      {
        outputTargetType: STANDALONE,
      },
    );

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
    (config.outputTargets[0] as d.OutputTargetStandalone).customElementsExportBehavior = 'bundle';
    buildCtx.components = [componentOne, componentTwo];

    const writeFileSpy = vi.spyOn(compilerCtx.fs, 'writeFile');

    await generateStandaloneTypes(config, compilerCtx, buildCtx, 'types_dir');

    const expectedTypedefOutput = [
      `export * from '../types_dir/standalone';`,
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

    expect(compilerCtx.fs.writeFile).toHaveBeenCalledWith(
      'my-best-dir/index.d.ts',
      expectedTypedefOutput,
      {
        outputTargetType: STANDALONE,
      },
    );

    writeFileSpy.mockRestore();
  });
});

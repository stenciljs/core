import * as d from '@stencil/core/declarations';
import { mockCompilerCtx, mockModule } from '@stencil/core/testing';
import * as ts from 'typescript';

import { stubComponentCompilerMeta } from '../../types/tests/ComponentCompilerMeta.stub';
import * as AddComponentMetaProxy from '../add-component-meta-proxy';
import { proxyCustomElement } from '../component-native/proxy-custom-element-function';
import { PROXY_CUSTOM_ELEMENT } from '../core-runtime-apis';
import * as TransformUtils from '../transform-utils';
import { transpileModule } from './transpile';
import { formatCode } from './utils';

describe('proxy-custom-element-function', () => {
  const componentClassName = 'MyComponent';
  let compilerCtx: d.CompilerCtx;
  let transformOpts: d.TransformOptions;

  let getModuleFromSourceFileSpy: jest.SpyInstance<
    ReturnType<typeof TransformUtils.getModuleFromSourceFile>,
    Parameters<typeof TransformUtils.getModuleFromSourceFile>
  >;
  let createClassMetadataProxySpy: jest.SpyInstance<
    ReturnType<typeof AddComponentMetaProxy.createClassMetadataProxy>,
    Parameters<typeof AddComponentMetaProxy.createClassMetadataProxy>
  >;

  beforeEach(() => {
    compilerCtx = mockCompilerCtx();

    transformOpts = {
      coreImportPath: '@stencil/core',
      componentExport: null,
      componentMetadata: null,
      currentDirectory: '/',
      proxy: null,
      style: 'static',
      styleImportData: 'queryparams',
    };

    getModuleFromSourceFileSpy = jest.spyOn(TransformUtils, 'getModuleFromSourceFile');
    getModuleFromSourceFileSpy.mockImplementation((_compilerCtx: d.CompilerCtx, _tsSourceFile: ts.SourceFile) => {
      return mockModule({
        cmps: [
          stubComponentCompilerMeta({
            componentClassName,
          }),
        ],
      });
    });

    createClassMetadataProxySpy = jest.spyOn(AddComponentMetaProxy, 'createClassMetadataProxy');
    createClassMetadataProxySpy.mockImplementation((_compilerMeta: d.ComponentCompilerMeta, clazz: ts.Expression) =>
      ts.factory.createCallExpression(
        ts.factory.createIdentifier(PROXY_CUSTOM_ELEMENT),
        [],
        [clazz, ts.factory.createTrue()],
      ),
    );
  });

  afterEach(() => {
    getModuleFromSourceFileSpy.mockRestore();
    createClassMetadataProxySpy.mockRestore();
  });

  describe('proxyCustomElement()', () => {
    it('imports PROXY_CUSTOM_ELEMENT', () => {
      const code = `const ${componentClassName} = class extends HTMLElement {};`;

      const transformer = proxyCustomElement(compilerCtx, transformOpts);
      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(transpiledModule.outputText).toContain(
        `import { proxyCustomElement as __stencil_proxyCustomElement } from "@stencil/core";`,
      );
    });

    it('wraps a class initializer in a proxyCustomElement call', async () => {
      const code = `const ${componentClassName} = class extends HTMLElement {};`;

      const transformer = proxyCustomElement(compilerCtx, transformOpts);
      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(await formatCode(transpiledModule.outputText)).toContain(
        await formatCode(
          `const ${componentClassName} = /*@__PURE__*/ __stencil_proxyCustomElement(class ${componentClassName} extends HTMLElement {}, true);`,
        ),
      );
    });

    it('wraps an exported class initializer in a proxyCustomElement call', async () => {
      const code = `export const ${componentClassName} = class extends HTMLElement {};`;

      const transformer = proxyCustomElement(compilerCtx, transformOpts);
      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(await formatCode(transpiledModule.outputText)).toContain(
        await formatCode(
          `export const ${componentClassName} = /*@__PURE__*/ __stencil_proxyCustomElement(class ${componentClassName} extends HTMLElement {}, true);`,
        ),
      );
    });

    describe('multiple variable declarations', () => {
      it('wraps a class initializer properly when a variable declaration precedes it', async () => {
        const code = `const foo = 'hello world!', ${componentClassName} = class extends HTMLElement {};`;

        const transformer = proxyCustomElement(compilerCtx, transformOpts);
        const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

        expect(await formatCode(transpiledModule.outputText)).toContain(
          await formatCode(
            `const foo = 'hello world!', ${componentClassName} = /*@__PURE__*/ __stencil_proxyCustomElement(class ${componentClassName} extends HTMLElement {}, true);`,
          ),
        );
      });

      it('wraps a class initializer properly when it precedes another variable declaration', async () => {
        const code = `const ${componentClassName} = class extends HTMLElement {}, foo = 'hello world!';`;

        const transformer = proxyCustomElement(compilerCtx, transformOpts);
        const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

        expect(await formatCode(transpiledModule.outputText)).toContain(
          await formatCode(
            `const ${componentClassName} = /*@__PURE__*/ __stencil_proxyCustomElement(class ${componentClassName} extends HTMLElement {}, true), foo = 'hello world!';`,
          ),
        );
      });

      it('wraps a class initializer properly in the middle of multiple variable declarations', async () => {
        const code = `const foo = 'hello world!', ${componentClassName} = class ${componentClassName} extends HTMLElement {}, bar = 'goodbye?'`;

        const transformer = proxyCustomElement(compilerCtx, transformOpts);
        const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

        expect(await formatCode(transpiledModule.outputText)).toContain(
          await formatCode(
            `const foo = 'hello world!', ${componentClassName} = /*@__PURE__*/ __stencil_proxyCustomElement(class ${componentClassName} extends HTMLElement {}, true), bar = 'goodbye?';`,
          ),
        );
      });
    });
  });

  describe('source file unchanged', () => {
    it('returns the source file when no Stencil module is found', async () => {
      getModuleFromSourceFileSpy.mockImplementation((_compilerCtx: d.CompilerCtx, _tsSourceFile: ts.SourceFile) => {
        return mockModule();
      });

      const code = `const ${componentClassName} = class extends HTMLElement {};`;

      const transformer = proxyCustomElement(compilerCtx, transformOpts);
      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(await formatCode(transpiledModule.outputText)).toBe(await formatCode(code));
    });

    it('returns the source file when no variable statements are found', () => {
      getModuleFromSourceFileSpy.mockImplementation((_compilerCtx: d.CompilerCtx, _tsSourceFile: ts.SourceFile) => {
        return mockModule({
          cmps: [stubComponentCompilerMeta({ componentClassName })],
        });
      });

      const code = `helloWorld();`;

      const transformer = proxyCustomElement(compilerCtx, transformOpts);
      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(transpiledModule.outputText.trim()).toBe(code);
    });

    it("returns the source file when variable statements don't match the component name", () => {
      getModuleFromSourceFileSpy.mockImplementation((_compilerCtx: d.CompilerCtx, _tsSourceFile: ts.SourceFile) => {
        return mockModule({
          cmps: [
            stubComponentCompilerMeta({
              componentClassName: 'ComponentNameDoesNotExist',
            }),
          ],
        });
      });

      const code = `const ${componentClassName} = class extends HTMLElement { };`;

      const transformer = proxyCustomElement(compilerCtx, transformOpts);
      const transpiledModule = transpileModule(code, null, compilerCtx, [], [transformer]);

      expect(transpiledModule.outputText.trim()).toBe(code);
    });
  });
});

import * as d from '@stencil/core';
import { mockModule } from '@stencil/core/testing';
import { mockCompilerCtx } from '@stencil/core/testing/compiler';
import * as ts from 'typescript';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { MockInstance } from 'vitest';

import { stubComponentCompilerMeta } from '../../types/_tests_/ComponentCompilerMeta.stub';
import { addDefineCustomElementFunctions } from '../component-native/add-define-custom-element-function';
import * as TransformUtils from '../transform-utils';
import { transpileModule } from './transpile';
import { formatCode } from './utils';

describe('addDefineCustomElementFunctions', () => {
  const componentClassName = 'CmpA';
  const tagName = 'cmp-a';
  let compilerCtx: d.CompilerCtx;
  let getModuleFromSourceFileSpy: MockInstance<typeof TransformUtils.getModuleFromSourceFile>;

  const outputTarget: d.OutputTargetStandalone = { type: 'standalone' };

  beforeEach(() => {
    compilerCtx = mockCompilerCtx();
    getModuleFromSourceFileSpy = vi.spyOn(TransformUtils, 'getModuleFromSourceFile');
    getModuleFromSourceFileSpy.mockImplementation(() =>
      mockModule({ cmps: [stubComponentCompilerMeta({ componentClassName, tagName })] }),
    );
  });

  afterEach(() => {
    getModuleFromSourceFileSpy.mockRestore();
  });

  const buildTransformer = (
    components: d.ComponentCompilerMeta[] = [],
    target: d.OutputTargetStandalone = outputTarget,
    devMode = false,
  ): ts.TransformerFactory<ts.SourceFile> =>
    addDefineCustomElementFunctions(compilerCtx, components, target, devMode);

  const transpile = (transformer: ts.TransformerFactory<ts.SourceFile>) => {
    const code = `export const ${componentClassName} = class extends HTMLElement {};`;
    return transpileModule(code, null, compilerCtx, [], [transformer]);
  };

  describe('generated defineCustomElement shape', () => {
    it('has an optional opts parameter', () => {
      const { outputText } = transpile(buildTransformer());
      expect(outputText).toContain('defineCustomElement(opts?)');
    });

    it('resolves the registry from opts falling back to the stored registry', async () => {
      const { outputText } = transpile(buildTransformer());
      const formatted = await formatCode(outputText);
      expect(formatted).toContain(await formatCode(`const _storeReg = __stencil_getRegistry();`));
      expect(formatted).toContain(await formatCode(`const _reg = opts?.registry ?? _storeReg;`));
      expect(formatted).not.toContain('_storeRoot');
      expect(formatted).not.toContain('_regRoot');
    });

    it('returns early when _reg is undefined', () => {
      const { outputText } = transpile(buildTransformer());
      expect(outputText).toContain(`typeof _reg === "undefined"`);
    });

    it('calls _reg.define instead of customElements.define', () => {
      const { outputText } = transpile(buildTransformer());
      expect(outputText).toContain('_reg.define');
      expect(outputText).not.toContain('customElements.define');
    });

    it('stamps _registry on the component class', () => {
      const { outputText } = transpile(buildTransformer());
      expect(outputText).toContain(`${componentClassName}._registry = _reg`);
    });

    it('calls __stencil_getRegistry to get the stored registry', () => {
      const { outputText } = transpile(buildTransformer());
      expect(outputText).toContain('__stencil_getRegistry');
    });
  });

  describe('dependencies', () => {
    it('threads opts through to dependency defineCustomElement calls', () => {
      const dep = stubComponentCompilerMeta({
        componentClassName: 'CmpB',
        tagName: 'cmp-b',
      });
      getModuleFromSourceFileSpy.mockImplementation(() =>
        mockModule({
          cmps: [
            stubComponentCompilerMeta({
              componentClassName,
              tagName,
              dependencies: ['cmp-b'],
            }),
          ],
        }),
      );

      const { outputText } = transpile(buildTransformer([dep]));
      expect(outputText).toContain('$CmpBDefineCustomElement(opts)');
    });
  });

  describe('auto-define-custom-elements behavior', () => {
    it('appends a no-arg defineCustomElement() call', () => {
      const target: d.OutputTargetStandalone = {
        type: 'standalone',
        customElementsExportBehavior: 'auto-define-custom-elements',
      };
      const { outputText } = transpile(buildTransformer([], target));
      expect(outputText).toContain('defineCustomElement()');
    });

    it('does not pass the component class as an argument', () => {
      const target: d.OutputTargetStandalone = {
        type: 'standalone',
        customElementsExportBehavior: 'auto-define-custom-elements',
      };
      const { outputText } = transpile(buildTransformer([], target));
      expect(outputText).not.toContain(`defineCustomElement(${componentClassName})`);
    });
  });

  describe('devMode', () => {
    it('stamps __stencil_module__ with import.meta.url in dev mode', () => {
      const { outputText } = transpile(buildTransformer([], outputTarget, true));
      expect(outputText).toContain('__stencil_module__');
      expect(outputText).toContain('import.meta.url');
    });

    it('does not emit __stencil_module__ in production mode', () => {
      const { outputText } = transpile(buildTransformer([], outputTarget, false));
      expect(outputText).not.toContain('__stencil_module__');
    });
  });

  describe('no component in module', () => {
    it('does not append defineCustomElement when the module has no components', () => {
      getModuleFromSourceFileSpy.mockImplementation(() => mockModule({ cmps: [] }));
      const { outputText } = transpile(buildTransformer());
      expect(outputText).not.toContain('defineCustomElement');
    });
  });
});

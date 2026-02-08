import { mockCompilerCtx } from '@stencil/core/testing';
import { ScriptTarget } from 'typescript';

import { transpileModule } from './transpile';

describe('ts config', () => {
  it('detects modern class property declarations', async () => {
    const compilerCtx = mockCompilerCtx();

    const cmps = [
      {
        code: `@Component({ tag: 'cmp-a' })
          export class CmpA { @Prop() aProp = 'prop'; }`,
        expected: true,
      },
      {
        code: `@Component({ tag: 'cmp-a' })
          export class CmpA { @State() aState = 'prop'; }`,
        expected: true,
      },
      {
        code: `@Component({ tag: 'cmp-a' })
          export class CmpA { 
            @Prop() get() { return 'prop'; }; 
          }`,
        expected: false,
      },
      {
        code: `const anotherProp = 'dynamic-string'
          @Component({ tag: 'cmp-a' })
          export class CmpA { @Prop() [anotherProp] = 'prop 2'; }`,
        expected: true,
      },
      {
        code: `const anotherProp = 'dynamic-string'
          @Component({ tag: 'cmp-a' })
          export class CmpA { @State() [anotherProp] = 'prop 2'; }`,
        expected: true,
      },
      {
        code: `@Component({ tag: 'cmp-a' })
        export class CmpA { #aPrivateField = 'private'; }`,
        expected: false,
      },
    ];

    cmps.forEach((cmpTest) => {
      const transpileResult = transpileModule(cmpTest.code, null, compilerCtx, [], [], [], {
        target: ScriptTarget.ES2022,
      });
      expect(transpileResult.cmp.hasModernPropertyDecls).toBe(cmpTest.expected);
    });

    cmps.forEach((cmpTest) => {
      const transpileResult = transpileModule(cmpTest.code, null, compilerCtx, [], [], [], {
        target: ScriptTarget.ES2017,
      });
      expect(transpileResult.cmp.hasModernPropertyDecls).toBe(false);
    });
  });
});

import * as ts from 'typescript';

import { transpileModule } from './transpile';
import { formatCode } from './utils';

describe('parse states', () => {
  it('state', async () => {
    const t = transpileModule(`
     const dynVal = 'val2';
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @State() val = 'good';
        @State() [dynVal] = 'nice';
      }
    `);

    expect(await formatCode(t.outputText)).toContain(
      await formatCode(`
        return { val: {}, val2: { ogPropName: 'dynVal' } }; 
    `),
    );
  });

  it('should merge extended class state meta', async () => {
    const t = transpileModule(
      `
      @Component({tag: 'cmp-a'})
      class CmpA extends Parent {
        @State() foo: string = 'cmp a foo';
      }
      class Parent extends GrandParent {
        @State() foo: string = 'parent foo';
      }
      class GrandParent {
        @State() bar: string = 'grandparent bar';
      }
    `,
      undefined,
      undefined,
      [],
      [],
      [],
      { target: ts.ScriptTarget.ESNext },
    );

    expect(t.states).toEqual([{ name: 'bar' }, { name: 'foo' }]);
  });
});

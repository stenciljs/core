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
});

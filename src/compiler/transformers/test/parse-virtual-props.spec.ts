import { transpileModule } from './transpile';

describe('parse virtual properties', () => {
  it('virtual properties', () => {
    const t = transpileModule(`
      /**
       * @virtualProp color - This is the virtual color property
       * @virtualProp {  'md' | 'ios'} mode - This is the mode
       */
      @Component({tag: 'cmp-a'})
      export class CmpA {}
    `);

    expect(t.virtualProperties).toEqual([
      { name: 'color', type: 'any', docs: 'This is the virtual color property' },
      { name: 'mode', type: `'md' | 'ios'`, docs: 'This is the mode' },
    ]);
  });
});

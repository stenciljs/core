import { getStaticGetter, transpileModule } from './transpile';

describe('parse element', () => {
  it('element', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Element() val: HTMLElement
      }
    `);

    expect(getStaticGetter(t.outputText, 'elementRef')).toEqual('val');
    expect(t.elementRef).toBe('val');
  });
});

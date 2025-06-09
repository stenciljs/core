import { getStaticGetter, transpileModule } from './transpile';

describe('parse component', () => {
  it('"is" for "tag"', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a'
      })
      export class CmpA {}
    `);

    expect(getStaticGetter(t.outputText, 'is')).toEqual('cmp-a');
    expect(t.tagName).toBe('cmp-a');
  });

  it('componentClassName', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a'
      })
      export class CmpA {}
    `);

    expect(t.componentClassName).toBe('CmpA');
  });

  it('can not have shadowRoot getter', () => {
    let error: Error | undefined;
    try {
      transpileModule(`
        @Component({
          tag: 'cmp-a'
        })
        export class CmpA {
          get shadowRoot() {
            return this;
          }
        }
      `);
    } catch (err: unknown) {
      error = err as Error;
    }

    expect(error.message).toContain(
      `The component "CmpA" has a getter called "shadowRoot". This getter is reserved for use by Stencil components and should not be defined by the user.`,
    );
  });

  it('ignores shadowRoot getter in unrelated class', () => {
    const t = transpileModule(`
      @Component({
        tag: 'cmp-a'
      })
      export class CmpA {
        // use a better name for the getter
        get elementShadowRoot() {
          return this;
        }
      }

      export class Unrelated {
        get shadowRoot() {
          return this;
        }
      }
    `);

    expect(t.componentClassName).toBe('CmpA');
  });
});

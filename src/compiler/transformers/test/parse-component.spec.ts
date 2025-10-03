import * as ts from 'typescript';

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

  it('should derive meta data from extended tree of classes', async () => {
    const t = transpileModule(`
    @Component({tag: 'cmp-a'})
      class CmpA extends Parent {
        @Prop() foo: string;
      }
      class Parent extends GrandParent {
        render() {}
      }
      class GrandParent {
        connectedCallback() {}
      }
    `);

    expect(t.cmp.hasRenderFn).toBe(true);
    expect(t.cmp.hasConnectedCallbackFn).toBe(true);
  });

  it('should derive `isExtended` and `isMixin`', async () => {
    let t = transpileModule(
      `
    @Component({tag: 'cmp-a'})
      class CmpA extends Parent {
        @Prop() foo: string;
      }
      class Parent extends GrandParent {
        render() {}
      }
      class GrandParent {
        connectedCallback() {}
      }
    `,
      undefined,
      undefined,
      [],
      [],
      [],
      { target: ts.ScriptTarget.ES2022 },
    );

    expect(t.isExtended).toBe(true);
    expect(t.isMixin).toBe(false);

    t = transpileModule(
      `
      @Component({tag: 'cmp-a'})
      class CmpA {
        @Prop() foo: string;
      }
      @Component({tag: 'cmp-b'})
      class CmpB extends CmpA {
        @Prop() foo: string;
      }
    `,
      undefined,
      undefined,
      [],
      [],
      [],
      { target: ts.ScriptTarget.ES2022 },
    );

    expect(t.isExtended).toBe(true);
    expect(t.isMixin).toBe(true);
  });

  it('should throw error if target is less than es2022', async () => {
    try {
      transpileModule(
        `
        @Component({tag: 'cmp-a'})
        class CmpA extends Parent {
          @Prop() foo: string = 'cmp a foo';
        }
        class Parent {
          @Prop() foo: string = 'parent foo';
        }
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ES2021 },
      );
    } catch (e: any) {
      expect(e.message).toContain('ES2022 and above');
    }
  });
});

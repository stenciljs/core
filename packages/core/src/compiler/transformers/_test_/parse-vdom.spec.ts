import { describe, expect, it } from 'vitest';

import { transpileModule } from './transpile';

describe('parse vdom', () => {
  it('hasVdomAttribute', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp checked="true"/>
        }
      }
    `);

    expect(t.cmp.hasVdomAttribute).toBe(true);
  });

  it('hasVdomClass', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp class="some-class"/>
        }
      }
    `);

    expect(t.cmp.hasVdomClass).toBe(true);
  });

  it('hasVdomFunctional', () => {
    const t = transpileModule(`
      const FnCmp = <fn-cmp/>;
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <FnCmp/>
        }
      }
    `);

    expect(t.cmp.hasVdomFunctional).toBe(true);
  });

  it('hasVdomFunctional (2)', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <Tunnel.Provider/>
        }
      }
    `);

    expect(t.cmp.hasVdomFunctional).toBe(true);
  });

  it('hasVdomKey', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp key="k"/>
        }
      }
    `);

    expect(t.cmp.hasVdomKey).toBe(true);
  });

  it('hasVdomListener', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp onClick="()=>{}"/>
        }
      }
    `);

    expect(t.cmp.hasVdomListener).toBe(true);
  });

  it('hasVdomRef', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp ref="()=>{}"/>
        }
      }
    `);

    expect(t.cmp.hasVdomRef).toBe(true);
  });

  it('hasVdomRender', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp/>
        }
      }
    `);

    expect(t.cmp.hasVdomRender).toBe(true);
  });

  it('hasVdomStyle', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp style={{color:red}}/>
        }
      }
    `);

    expect(t.cmp.hasVdomStyle).toBe(true);
  });

  it('hasVdomPropOrAttrPrefix with attr: prefix', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <input attr:value="1"/>
        }
      }
    `);

    expect(t.cmp.hasVdomPropOrAttrPrefix).toBe(true);
    expect(t.cmp.hasVdomPropOrAttr).toBe(false);
  });

  it('hasVdomPropOrAttrPrefix with prop: prefix', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <input prop:value="1"/>
        }
      }
    `);

    expect(t.cmp.hasVdomPropOrAttrPrefix).toBe(true);
    expect(t.cmp.hasVdomPropOrAttr).toBe(false);
  });

  it('hasVdomPropOrAttrPrefix stays false for plain attributes', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp value="1"/>
        }
      }
    `);

    expect(t.cmp.hasVdomPropOrAttrPrefix).toBe(false);
    expect(t.cmp.hasVdomPropOrAttr).toBe(true);
  });

  it('hasVdomText', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp>text</some-cmp>
        }
      }
    `);

    expect(t.cmp.hasVdomText).toBe(true);
  });

  it('htmlParts preserves case and splits on whitespace', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp part="clickTarget otherPart"/>
        }
      }
    `);

    expect(t.cmp.htmlParts).toEqual(['clickTarget', 'otherPart']);
  });

  it('hasSlot', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <slot/>
        }
      }
    `);

    expect(t.cmp.htmlTagNames).toContain('slot');
  });

  it('htmlSlots captures the default slot', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <slot/>
        }
      }
    `);

    expect(t.cmp.htmlSlots).toEqual(['']);
  });

  it('htmlSlots captures named slots', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return (
            <div>
              <slot name="header"/>
              <slot/>
              <slot name="footer"/>
            </div>
          )
        }
      }
    `);

    expect(t.cmp.htmlSlots).toEqual(['header', '', 'footer']);
  });

  it('htmlSlots does not capture slot names from spread attributes', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          const attrs = { name: 'dynamic' };
          return <slot {...attrs}/>
        }
      }
    `);

    expect(t.cmp.htmlSlots).toEqual([]);
  });

  it('htmlSlots resolves a slot name from a const binding via the type checker', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          const slotName = 'header';
          return <slot name={slotName}/>
        }
      }
    `);

    expect(t.cmp.htmlSlots).toEqual(['header']);
  });

  it('htmlSlots resolves a slot name from a readonly class field via the type checker', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        private readonly slotName = 'footer';
        render() {
          return <slot name={this.slotName}/>
        }
      }
    `);

    expect(t.cmp.htmlSlots).toEqual(['footer']);
  });

  it('htmlSlots does not resolve a slot name from a mutable (non-readonly) class field', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        slotName = 'header';
        render() {
          return <slot name={this.slotName}/>
        }
      }
    `);

    expect(t.cmp.htmlSlots).toEqual([]);
  });

  it('htmlParts resolves a part name from a static readonly field via the type checker', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        static readonly PART = 'my-part';
        render() {
          return <some-cmp part={CmpA.PART}/>
        }
      }
    `);

    expect(t.cmp.htmlParts).toEqual(['my-part']);
  });

  it('hasSvg', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <svg/>
        }
      }
    `);

    expect(t.cmp.htmlTagNames).toContain('svg');
  });

  describe('jsx-runtime (jsxImportSource)', () => {
    it('hasVdomFunctional with Fragment', () => {
      const t = transpileModule(
        `
        @Component({tag: 'cmp-a'})
        export class CmpA {
          render() {
            return (
              <>
                <div>A</div>
                <div>B</div>
              </>
            );
          }
        }
      `,
        null,
        null,
        [],
        [],
        [],
        {
          jsx: 4 as any, // ts.JsxEmit.ReactJSX
          jsxImportSource: '@stencil/core',
        },
      );

      expect(t.cmp.hasVdomFunctional).toBe(true);
      expect(t.cmp.hasVdomRender).toBe(true);
    });

    it('hasVdomFunctional with functional component', () => {
      const t = transpileModule(
        `
        const MyComponent = () => <div>Hello</div>;
        @Component({tag: 'cmp-a'})
        export class CmpA {
          render() {
            return <MyComponent/>
          }
        }
      `,
        null,
        null,
        [],
        [],
        [],
        {
          jsx: 4 as any, // ts.JsxEmit.ReactJSX
          jsxImportSource: '@stencil/core',
        },
      );

      expect(t.cmp.hasVdomFunctional).toBe(true);
    });

    it('hasVdomFunctional with Fragment single child', () => {
      const t = transpileModule(
        `
        @Component({tag: 'cmp-b'})
        export class CmpB {
          render() {
            return (
              <>
                <div>Single</div>
              </>
            );
          }
        }
      `,
        null,
        null,
        [],
        [],
        [],
        {
          jsx: 4 as any, // ts.JsxEmit.ReactJSX
          jsxImportSource: '@stencil/core',
        },
      );

      expect(t.cmp.hasVdomFunctional).toBe(true);
    });

    it('hasVdomAttribute with jsx-runtime', () => {
      const t = transpileModule(
        `
        @Component({tag: 'cmp-a'})
        export class CmpA {
          render() {
            return <div class="test">Hello</div>
          }
        }
      `,
        null,
        null,
        [],
        [],
        [],
        {
          jsx: 4 as any, // ts.JsxEmit.ReactJSX
          jsxImportSource: '@stencil/core',
        },
      );

      expect(t.cmp.hasVdomAttribute).toBe(true);
      expect(t.cmp.hasVdomClass).toBe(true);
    });
  });
});

import { transpileModule } from './transpile';
import { describe, expect, it } from 'vitest';

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

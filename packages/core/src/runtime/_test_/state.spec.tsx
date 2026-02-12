import { Component, Method, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

function Clamp(lowerBound: number, upperBound: number): any {
  const clamp = (value: number) => Math.max(lowerBound, Math.min(value, upperBound));
  return () => {
    const key = Symbol();
    return {
      get() {
        return this[key];
      },
      set(newValue: number) {
        this[key] = clamp(newValue);
      },
      configurable: true,
      enumerable: true,
    };
  };
}

describe('state', () => {
  it('set default values, update on re-render', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @State() boolFalse = false;
      @State() boolTrue = true;
      @State() str = 'string';
      @State() num = 88;
      @Clamp(0, 10)
      @State()
      clamped = -1;

      @Method()
      async update() {
        (this.boolFalse = true), (this.boolTrue = false);
        this.str = 'hello';
        this.num = 99;
        this.clamped = 11;
      }

      render() {
        return `${this.boolFalse}-${this.boolTrue}-${this.str}-${this.num}-${this.clamped}`;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a>false-true-string-88-0</cmp-a>
    `);

    expect(root.textContent).toBe('false-true-string-88-0');
    expect(root.boolFalse).toBe(undefined);
    expect(root.boolTrue).toBe(undefined);
    expect(root.str).toBe(undefined);
    expect(root.num).toBe(undefined);
    expect(root.clamped).toBe(undefined);

    await root.update();
    await waitForChanges();

    expect(root.textContent).toBe('true-false-hello-99-10');
  });
});

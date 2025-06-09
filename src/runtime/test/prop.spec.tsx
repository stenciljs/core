import { Component, h, Prop } from '@stencil/core';
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

describe('prop', () => {
  it('"value" attribute', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() value: string;

      render() {
        return <code>{this.value.trim()}</code>;
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a value="#005a00"></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a value="#005a00">
        <code>#005a00</code>
      </cmp-a>
    `);
  });

  it('override default values from attribute', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() boolFalse = false;
      @Prop() boolTrue = true;
      @Prop() str = 'string';
      @Prop() num = 88;
      private _accessor = 'accessor';
      @Prop()
      get accessor() {
        return this._accessor;
      }
      set accessor(newVal) {
        this._accessor = newVal;
      }
      @Clamp(0, 10)
      @Prop()
      clamped = 5;
      render() {
        return `${this.boolFalse}-${this.boolTrue}-${this.str}-${this.num}-${this.accessor}-${this.clamped}`;
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a bool-false="true" bool-true="false" str="attr" num="99" accessor="accessed!" clamped="11"></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a bool-false="true" bool-true="false" str="attr" num="99" accessor="accessed!" clamped="11">
        true-false-attr-99-accessed!-10
      </cmp-a>
    `);

    expect(root.textContent).toBe('true-false-attr-99-accessed!-10');
    expect(root.boolFalse).toBe(true);
    expect(root.boolTrue).toBe(false);
    expect(root.str).toBe('attr');
    expect(root.num).toBe(99);
    expect(root.clamped).toBe(10);
    expect(root.accessor).toBe('accessed!');
  });

  it('set default values', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() boolFalse = false;
      @Prop() boolTrue = true;
      @Prop() str = 'string';
      @Prop() num = 88;
      private _accessor = 'accessor';
      @Prop()
      get accessor() {
        return this._accessor;
      }
      set accessor(newVal) {
        this._accessor = newVal;
      }
      @Clamp(0, 5)
      @Prop()
      clamped = 11;
      render() {
        return `${this.boolFalse}-${this.boolTrue}-${this.str}-${this.num}-${this.accessor}-${this.clamped}`;
      }
    }

    const { root } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a>false-true-string-88-accessor-5</cmp-a>
    `);

    expect(root.textContent).toBe('false-true-string-88-accessor-5');
    expect(root.boolFalse).toBe(false);
    expect(root.boolTrue).toBe(true);
    expect(root.str).toBe('string');
    expect(root.num).toBe(88);
    expect(root.accessor).toBe('accessor');
    expect(root.clamped).toBe(5);
  });

  it('only update on even numbers', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() num = 1;

      componentShouldUpdate(newValue: number, _: number, propName: string) {
        if (propName === 'num') {
          return newValue % 2 === 0;
        }
        return true;
      }
      render() {
        return `${this.num}`;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a>1</cmp-a>
    `);

    root.num++;
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>2</cmp-a>
    `);
    root.num++;
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>2</cmp-a>
    `);
    root.num++;
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>4</cmp-a>
    `);
  });

  it('only updates on even numbers via a setter', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      private _num = 1;
      @Prop()
      get num() {
        return this._num;
      }
      set num(newValue: number) {
        if (newValue % 2 === 0) this._num = newValue;
      }
      render() {
        return `${this.num}`;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a>1</cmp-a>
    `);

    root.num = 2;
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>2</cmp-a>
    `);
    root.num = 3;
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>2</cmp-a>
    `);
    root.num = 4;
    await waitForChanges();
    expect(root).toEqualHtml(`
      <cmp-a>4</cmp-a>
    `);
  });
});

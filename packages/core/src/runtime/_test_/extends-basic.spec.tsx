import { Component, h, Prop, Watch } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

describe('extends', () => {
  it('renders a component that extends from a base class', async () => {
    class Base {
      baseProp = 'base';
    }
    @Component({ tag: 'cmp-a' })
    class CmpA extends Base {
      render() {
        return `${this.baseProp}`;
      }
    }

    const page = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(page.root).toEqualHtml(`
      <cmp-a>base</cmp-a>
    `);
  });

  it('should call inherited watch methods when props change', async () => {
    let called = 0;

    class BaseWatch {
      @Prop() foo: string;

      @Watch('foo')
      fooChanged() {
        called++;
      }
    }

    @Component({ tag: 'extended-component' })
    class ExtendedComponent extends BaseWatch {
      render() {
        return <div>{this.foo}</div>;
      }
    }

    const { root } = await newSpecPage({
      components: [ExtendedComponent],
      html: `<extended-component></extended-component>`,
    });

    expect(called).toBe(0);

    root.foo = '1';

    expect(called).toBe(1);
    expect(root.foo).toBe('1');
  });
});

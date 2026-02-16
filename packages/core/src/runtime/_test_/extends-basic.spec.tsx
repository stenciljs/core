import { Component, h, Prop, Watch } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { expect, describe, it } from '@stencil/vitest';

describe('extends', () => {

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

    const { root, waitForChanges } = await newSpecPage({
      components: [ExtendedComponent],
      html: `<extended-component></extended-component>`,
    });

    expect(called).toBe(0);
    
    root.foo = '1';
    await waitForChanges();

    expect(called).toBe(1);
    expect(root.foo).toBe('1');
  });
});

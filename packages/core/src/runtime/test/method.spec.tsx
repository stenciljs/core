import { Component, Method, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('method', () => {
  it('call method', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @State() someState = 'default';

      @Method()
      async asyncMethod(val: string) {
        this.someState = val;
      }

      @Method()
      promiseMethod(val: string) {
        return new Promise((resolve) => {
          this.someState = val;
          resolve();
        });
      }

      render() {
        return `${this.someState}`;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a>default</cmp-a>
    `);

    await root.asyncMethod('async');

    await waitForChanges();

    expect(root.textContent).toBe('async');

    await root.promiseMethod('promise');

    await waitForChanges();

    expect(root.textContent).toBe('promise');
  });
});

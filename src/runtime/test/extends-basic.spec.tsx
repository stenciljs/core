import { Component } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

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
});

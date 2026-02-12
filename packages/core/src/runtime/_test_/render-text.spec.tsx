import { Component, Prop } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('render-text', () => {
  @Component({ tag: 'cmp-a' })
  class CmpA {
    render() {
      return 'Hello World';
    }
  }

  it('Hello World, html option', async () => {
    const { body } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(body).toEqualHtml(`
      <cmp-a>Hello World</cmp-a>
    `);
  });

  @Component({ tag: 'cmp-a', shadow: true })
  class CmpAShadow {
    render() {
      return 'Hello World';
    }
  }

  it('Hello World, innerHTML, await waitForChanges, shadow component', async () => {
    const { body, waitForChanges } = await newSpecPage({
      components: [CmpAShadow],
    });

    body.innerHTML = `<cmp-a></cmp-a>`;
    await waitForChanges();

    expect(body).toEqualHtml(`
      <cmp-a>
        <mock:shadow-root>
          Hello World
        </mock:shadow-root>
      </cmp-a>
    `);
  });

  it('Hello World, innerHTML, await waitForChanges', async () => {
    const { body, waitForChanges } = await newSpecPage({
      components: [CmpA],
    });

    body.innerHTML = `<cmp-a></cmp-a>`;
    await waitForChanges();

    expect(body).toEqualHtml(`
      <cmp-a>Hello World</cmp-a>
    `);
  });

  it('Hello World, page.setContent, await waitForChanges', async () => {
    const page = await newSpecPage({
      components: [CmpA],
    });

    await page.setContent(`<cmp-a></cmp-a>`);

    expect(page.body).toEqualHtml(`
      <cmp-a>Hello World</cmp-a>
    `);
    expect(page.root).toEqualHtml(`<cmp-a>Hello World</cmp-a>`);
    expect(page.rootInstance).not.toBeUndefined();
    expect(page.rootInstance).not.toBeNull();
  });

  it('Hello World, re-render, waitForChanges', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      @Prop() excitement = '';
      render() {
        return `Hello World${this.excitement}`;
      }
    }

    const { root, waitForChanges } = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
    });

    expect(root).toEqualHtml(`
      <cmp-a>Hello World</cmp-a>
    `);

    root.excitement = `!`;
    await waitForChanges();

    expect(root).toEqualHtml(`
      <cmp-a>Hello World!</cmp-a>
    `);

    root.excitement = `!!`;
    await waitForChanges();

    expect(root).toEqualHtml(`
      <cmp-a>Hello World!!</cmp-a>
    `);
  });
});

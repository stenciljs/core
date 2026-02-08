import { Component, h, Host } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('hydrate scoped', () => {
  it('does not support shadow, slot, light dom', async () => {
    @Component({ tag: 'cmp-a', shadow: true })
    class CmpA {
      render() {
        return (
          <Host>
            <article>
              <slot />
            </article>
          </Host>
        );
      }
    }
    // @ts-ignore
    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a>88mph</cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <!--o.0.1.-->
        <article c-id="1.0.0.0">
          <!--s.1.1.1.0.-->
          <!--t.0.1-->
          88mph
        </article>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
      supportsShadowDom: false,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <article>
          <!--s.1.1.1.0.-->
          88mph
        </article>
      </cmp-a>
    `);
  });

  it('scoped, slot, light dom', async () => {
    @Component({ tag: 'cmp-a', scoped: true })
    class CmpA {
      render() {
        return (
          <Host>
            <article>
              <slot />
            </article>
          </Host>
        );
      }
    }
    // @ts-ignore
    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a>88mph</cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <!--o.0.1.c-->
        <article c-id="1.0.0.0">
          <!--s.1.1.1.0.-->
          <!--t.0.1-->
          88mph
        </article>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });
    expect(clientHydrated.root['s-id']).toBe('1');
    expect(clientHydrated.root['s-cr'].nodeType).toBe(8);
    expect(clientHydrated.root['s-cr']['s-cn']).toBe(true);

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated sc-cmp-a-h">
        <!--r.1-->
        <article class="sc-cmp-a sc-cmp-a-s">
          <!--s.1.1.1.0.-->
          88mph
        </article>
      </cmp-a>
    `);
  });

  it('root element, no slot', async () => {
    @Component({ tag: 'cmp-a', scoped: true })
    class CmpA {
      render() {
        return (
          <Host>
            <p class="hi">Hello</p>
          </Host>
        );
      }
    }
    // @ts-ignore
    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <p c-id="1.0.0.0" class="hi">
          <!--t.1.1.1.0-->
          Hello
        </p>
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });
    expect(clientHydrated.root['s-id']).toBe('1');
    expect(clientHydrated.root['s-cr'].nodeType).toBe(8);
    expect(clientHydrated.root['s-cr']['s-cn']).toBe(true);

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated sc-cmp-a-h">
        <!--r.1-->
        <p class="hi sc-cmp-a">
          Hello
        </p>
      </cmp-a>
    `);
  });

  it('adds a scoped-slot class to the slot parent element', async () => {
    @Component({ tag: 'cmp-a', scoped: true })
    class CmpA {
      render() {
        return (
          <Host>
            <div class="wrapper">
              <p class="hi">
                <slot />
              </p>
            </div>
          </Host>
        );
      }
    }
    // @ts-ignore
    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class=\"hydrated\" s-id=\"1\">
        <!--r.1-->
        <div c-id=\"1.0.0.0\" class=\"wrapper\">
          <p c-id=\"1.1.1.0\" class=\"hi\">
            <!--s.1.2.2.0.-->
          </p>
        </div>
      </cmp-a>`);

    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });
    expect(clientHydrated.root.querySelector('p').className).toBe('hi sc-cmp-a-s sc-cmp-a');

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class=\"hydrated sc-cmp-a-h\">
        <!--r.1-->
        <div class=\"sc-cmp-a wrapper\">
          <p class=\"hi sc-cmp-a sc-cmp-a-s\">
            <!--s.1.2.2.0.-->
          </p>
        </div>
      </cmp-a>`);
  });
});

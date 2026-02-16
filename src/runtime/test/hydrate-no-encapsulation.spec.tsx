import { Component, h, Host } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('hydrate no encapsulation', () => {
  it('no script annotations', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <script>console.log('script')</script>
          </Host>
        );
      }
    }
    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <script c-id="1.0.0.0">console.log('script')</script>
      </cmp-a>
    `);
  });

  it('root element, no slot', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <p class="hi">Hello</p>
          </Host>
        );
      }
    }
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
      <cmp-a class="hydrated">
        <!--r.1-->
        <p class="hi">
          Hello
        </p>
      </cmp-a>
    `);
  });

  it('root text, no slot', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return <Host>Hello</Host>;
      }
    }
    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <!--t.1.0.0.0-->
        Hello
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
      <cmp-a class="hydrated">
        <!--r.1-->
        Hello
      </cmp-a>
    `);
  });

  it('root multiple text/element, no slot', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            top
            <p>middle</p>
            bottom
          </Host>
        );
      }
    }
    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <!--t.1.0.0.0-->
        top
        <p c-id="1.1.0.1">
          <!--t.1.2.1.0-->
          middle
        </p>
        <!--t.1.3.0.2-->
        bottom
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });
    expect(clientHydrated.root['s-id']).toBe('1');

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        top
        <p>
          middle
        </p>
        bottom
      </cmp-a>
    `);
  });

  it('nested text slot with key', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host key="test">
            <cmp-b key="my-test-key">light-dom</cmp-b>
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-b' })
    class CmpB {
      render() {
        return (
          <Host>
            <slot key="key1"></slot>
            <footer key="key2"></footer>
          </Host>
        );
      }
    }
    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <cmp-b class="hydrated" c-id="1.0.0.0" s-id="2">
          <!--r.2-->
          <!--o.1.1-->
          <!--s.2.0.0.0.-->
          <!--t.1.1.1.0-->
          light-dom
          <footer c-id="2.1.0.1"></footer>
        </cmp-b>
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <!--r.2-->
          <!--s.2.0.0.0.-->
          light-dom
          <footer></footer>
        </cmp-b>
      </cmp-a>
    `);
  });

  it('nested, text slot, footer', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <cmp-b>light-dom</cmp-b>
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-b' })
    class CmpB {
      render() {
        return (
          <Host>
            <slot></slot>
            <footer></footer>
          </Host>
        );
      }
    }
    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <cmp-b class="hydrated" c-id="1.0.0.0" s-id="2">
          <!--r.2-->
          <!--o.1.1-->
          <!--s.2.0.0.0.-->
          <!--t.1.1.1.0-->
          light-dom
          <footer c-id="2.1.0.1"></footer>
        </cmp-b>
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <!--r.2-->
          <!--s.2.0.0.0.-->
          light-dom
          <footer></footer>
        </cmp-b>
      </cmp-a>
    `);
  });

  it('nested, text slot, header', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <cmp-b>light-dom</cmp-b>
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-b' })
    class CmpB {
      render() {
        return (
          <Host>
            <header></header>
            <slot></slot>
          </Host>
        );
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <cmp-b class="hydrated" c-id="1.0.0.0" s-id="2">
          <!--r.2-->
          <!--o.1.1-->
          <header c-id="2.0.0.0"></header>
          <!--s.2.1.0.1.-->
          <!--t.1.1.1.0-->
          light-dom
        </cmp-b>
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <!--r.2-->
          <header></header>
          <!--s.2.1.0.1.-->
          light-dom
        </cmp-b>
      </cmp-a>
    `);
  });

  it('nested, text slot, header/footer', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <cmp-b>light-dom</cmp-b>
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-b' })
    class CmpB {
      render() {
        return (
          <Host>
            <header></header>
            <slot></slot>
            <footer></footer>
          </Host>
        );
      }
    }
    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <cmp-b class="hydrated" c-id="1.0.0.0" s-id="2">
          <!--r.2-->
          <!--o.1.1-->
          <header c-id="2.0.0.0"></header>
          <!--s.2.1.0.1.-->
          <!--t.1.1.1.0-->
          light-dom
          <footer c-id="2.2.0.2"></footer>
        </cmp-b>
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <!--r.2-->
          <header></header>
          <!--s.2.1.0.1.-->
          light-dom
          <footer></footer>
        </cmp-b>
      </cmp-a>
    `);
  });

  it('nested, multiple slots, header/footer', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <cmp-b>
              <div slot="bottom">bottom light-dom</div>
              <div slot="top">top light-dom</div>
              middle light-dom
            </cmp-b>
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-b' })
    class CmpB {
      render() {
        return (
          <Host>
            <header></header>
            <slot name="top"></slot>
            <slot></slot>
            <slot name="bottom"></slot>
            <footer></footer>
          </Host>
        );
      }
    }
    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <cmp-b class="hydrated" c-id="1.0.0.0" s-id="2">
          <!--r.2-->
          <!--o.1.1-->
          <!--o.1.3-->
          <!--o.1.5-->
          <header c-id="2.0.0.0"></header>
          <!--s.2.1.0.1.top-->
          <div c-id="1.3.1.1" slot="top">
            <!--t.1.4.2.0-->
            top light-dom
          </div>
          <!--s.2.2.0.2.-->
          <!--t.1.5.1.2-->
          middle light-dom
          <!--s.2.3.0.3.bottom-->
          <div c-id="1.1.1.0" slot="bottom">
            <!--t.1.2.2.0-->
            bottom light-dom
          </div>
          <footer c-id="2.4.0.4"></footer>
        </cmp-b>
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <!--r.2-->
          <header></header>
          <!--s.2.1.0.1.top-->
          <div slot="top">
            top light-dom
          </div>
          <!--s.2.2.0.2.-->
          middle light-dom
          <!--s.2.3.0.3.bottom-->
          <div slot="bottom">
            bottom light-dom
          </div>
          <footer></footer>
        </cmp-b>
      </cmp-a>
    `);
  });
});

import { Component, h, Host } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('hydrate, shadow child', () => {
  it('no slot', async () => {
    @Component({ tag: 'cmp-a', shadow: true })
    class CmpA {
      render() {
        return (
          <Host>
            <p>Hello</p>
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
        <p c-id="1.0.0.0">
          <!--t.1.1.1.0-->
          Hello
        </p>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });
    expect(clientHydrated.root['s-id']).toBe('1');

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <mock:shadow-root>
          <p>
            Hello
          </p>
        </mock:shadow-root>
      </cmp-a>
    `);
  });

  it('nested cmp-b w/ shadow, text slot', async () => {
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
    @Component({ tag: 'cmp-b', shadow: true })
    class CmpB {
      render() {
        return (
          <Host>
            <slot></slot>
          </Host>
        );
      }
    }
    // @ts-ignore
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
          <!--o.1.1.-->
          <!--s.2.0.0.0.-->
          <!--t.1.1.1.0-->
          light-dom
        </cmp-b>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <mock:shadow-root>
            <slot></slot>
          </mock:shadow-root>
          light-dom
        </cmp-b>
      </cmp-a>
    `);
  });

  it('nested cmp-b w/ shadow, shadow element header', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <cmp-b></cmp-b>
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-b', shadow: true })
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
    // @ts-ignore
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
          <header c-id="2.0.0.0"></header>
          <!--s.2.1.0.1.-->
        </cmp-b>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <mock:shadow-root>
            <header></header>
            <slot></slot>
          </mock:shadow-root>
        </cmp-b>
      </cmp-a>
    `);
  });

  it('nested cmp-b w/ shadow, shadow text header', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <cmp-b></cmp-b>
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-b', shadow: true })
    class CmpB {
      render() {
        return (
          <Host>
            shadow-header
            <slot></slot>
          </Host>
        );
      }
    }
    // @ts-ignore
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
          <!--t.2.0.0.0-->
          shadow-header
          <!--s.2.1.0.1.-->
        </cmp-b>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <mock:shadow-root>
            shadow-header
            <slot></slot>
          </mock:shadow-root>
        </cmp-b>
      </cmp-a>
    `);
  });

  it('nested shadow, text slot, header', async () => {
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
    @Component({ tag: 'cmp-b', shadow: true })
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
    // @ts-ignore
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
          <!--o.1.1.-->
          <header c-id="2.0.0.0"></header>
          <!--s.2.1.0.1.-->
          <!--t.1.1.1.0-->
          light-dom
        </cmp-b>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <mock:shadow-root>
            <header></header>
            <slot></slot>
          </mock:shadow-root>
          light-dom
        </cmp-b>
      </cmp-a>
    `);
  });

  it('nested cmp-b w/ shadow, shadow header text, shadow footer elm w/ text', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <cmp-b></cmp-b>
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-b', shadow: true })
    class CmpB {
      render() {
        return (
          <Host>
            shadow-header
            <footer>shadow-footer</footer>
          </Host>
        );
      }
    }
    // @ts-ignore
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
          <!--t.2.0.0.0-->
          shadow-header
          <footer c-id="2.1.0.1">
            <!--t.2.2.1.0-->
            shadow-footer
          </footer>
        </cmp-b>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <mock:shadow-root>
            shadow-header
            <footer>
              shadow-footer
            </footer>
          </mock:shadow-root>
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
    @Component({ tag: 'cmp-b', shadow: true })
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
    // @ts-ignore
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
          <!--o.1.1.-->
          <header c-id="2.0.0.0"></header>
          <!--s.2.1.0.1.-->
          <!--t.1.1.1.0-->
          light-dom
          <footer c-id="2.2.0.2"></footer>
        </cmp-b>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <cmp-b class="hydrated">
          <mock:shadow-root>
            <header></header>
            <slot></slot>
            <footer></footer>
          </mock:shadow-root>
          light-dom
        </cmp-b>
      </cmp-a>
    `);
  });

  it('root level element, non-shadow, shadow, shadow,', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (
          <Host>
            <slot />
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-b', shadow: true })
    class CmpB {
      render() {
        return (
          <Host>
            <section>
              <slot></slot>
            </section>
          </Host>
        );
      }
    }
    @Component({ tag: 'cmp-c', shadow: true })
    class CmpC {
      render() {
        return (
          <Host>
            <article>cmp-c</article>
          </Host>
        );
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB, CmpC],
      html: `
        <cmp-a>
          <cmp-b>
            cmp-b-top-text
            <cmp-c></cmp-c>
          </cmp-b>
        </cmp-a>
      `,
      hydrateServerSide: true,
    });

    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <!--o.0.2-->
        <!--s.1.0.0.0.-->
        <cmp-b c-id="0.2" class="hydrated" s-id="2" s-sn="">
          <!--r.2-->
          <!--o.0.4.-->
          <!--o.0.5.-->
          <section c-id="2.0.0.0">
            <!--s.2.1.1.0.-->
            <!--t.0.4-->
            cmp-b-top-text
            <cmp-c c-id="0.5" class="hydrated" s-id="3" s-sn="">
              <!--r.3-->
              <article c-id="3.0.0.0">
                <!--t.3.1.1.0-->
                cmp-c
              </article>
            </cmp-c>
          </section>
        </cmp-b>
      </cmp-a>
    `);

    // @ts-ignore
    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB, CmpC],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class=\"hydrated\">
        <!--r.1-->
        <!--s.1.0.0.0.-->
        <cmp-b class=\"hydrated\">
          <mock:shadow-root>
            <section>
              <slot></slot>
            </section>
          </mock:shadow-root>
          cmp-b-top-text
          <cmp-c class=\"hydrated\">
            <mock:shadow-root>
              <article>
                cmp-c
              </article>
            </mock:shadow-root>
          </cmp-c>
        </cmp-b>
      </cmp-a>
    `);
  });

  it('preserves all nodes', async () => {
    @Component({
      tag: 'cmp-a',
      shadow: true,
    })
    class CmpA {
      render() {
        return <slot>Shadow Content</slot>;
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `
        <cmp-a>
          A text node
          <!-- a comment -->
          <div>An element</div>
          <!-- another comment -->
          Another text node
        </cmp-a>
      `,
      hydrateServerSide: true,
    });

    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class=\"hydrated\" s-id=\"1\">
        <!--r.1-->
        <!--o.0.1.-->
        <!--o.0.2.-->
        <!--o.0.4.-->
        <!--o.0.6.-->
        <!--o.0.7.-->
        <slot-fb c-id=\"1.0.0.0\" hidden=\"\" s-sn=\"\">
          <!--t.1.1.1.0-->
          Shadow Content
        </slot-fb>
        <!--t.0.1-->
        A text node
        <!--c.0.2-->
        <!-- a comment -->
        <div c-id=\"0.4\" s-sn=\"\">
          An element
        </div>
        <!--c.0.6-->
        <!-- another comment -->
        <!--t.0.7-->
        Another text node
      </cmp-a>  
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class=\"hydrated\">
        <mock:shadow-root>
          <slot>
            Shadow Content
          </slot>
        </mock:shadow-root>
        A text node
        <!-- a comment -->
        <div>
          An element
        </div>
        <!-- another comment -->
        Another text node
      </cmp-a>  
    `);
  });
});

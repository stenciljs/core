import { Component, h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('hydrate, slot fallback', () => {
  it('shows slot fallback content in a `scoped: true` parent', async () => {
    @Component({
      tag: 'cmp-a',
      scoped: true,
    })
    class CmpA {
      render() {
        return (
          <article>
            <slot>
              Fallback text - should not be hidden
              <strong>Fallback element</strong>
            </slot>
          </article>
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
        <article c-id="1.0.0.0">
          <slot-fb c-id="1.1.1.0" s-sn="">
            <!--t.1.2.2.0-->
            Fallback text - should not be hidden
            <strong c-id="1.3.2.1">
              <!--t.1.4.3.0-->
              Fallback element
            </strong>
          </slot-fb>
        </article>
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated sc-cmp-a-h">
        <!--r.1-->
        <article class="sc-cmp-a sc-cmp-a-s">
          <slot-fb class="sc-cmp-a">
            Fallback text - should not be hidden
            <strong class="sc-cmp-a">
              Fallback element
            </strong>
          </slot-fb>
        </article>
      </cmp-a>
    `);
  });

  it('shows slot fallback content in a `shadow: true` component`', async () => {
    @Component({
      tag: 'cmp-a',
      shadow: true,
    })
    class CmpA {
      render() {
        return (
          <article>
            <slot>
              Fallback text - should not be hidden
              <strong>Fallback element</strong>
            </slot>
          </article>
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
        <article c-id="1.0.0.0">
          <slot-fb c-id="1.1.1.0" s-sn="">
            <!--t.1.2.2.0-->
            Fallback text - should not be hidden
            <strong c-id="1.3.2.1">
              <!--t.1.4.3.0-->
              Fallback element
            </strong>
          </slot-fb>
        </article>
      </cmp-a>  
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <mock:shadow-root>
          <article>
            <slot>
              Fallback text - should not be hidden
              <strong>
                Fallback element
              </strong>
            </slot>
          </article>
        </mock:shadow-root>
      </cmp-a>  
    `);
  });

  it('shows slot fallback text in a nested `scoped: true` component (hides the fallback in the `scoped: true` parent component)', async () => {
    @Component({
      tag: 'cmp-a',
      scoped: true,
    })
    class CmpA {
      render() {
        return (
          <article>
            <slot>Fallback content parent - should be hidden</slot>
            <p>Non slot based content</p>
          </article>
        );
      }
    }

    @Component({
      tag: 'cmp-b',
      scoped: true,
    })
    class CmpB {
      render() {
        return (
          <section>
            <slot>Fallback content child - should not be hidden</slot>
            <p>Non slot based content</p>
          </section>
        );
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: `<cmp-a><cmp-b></cmp-b></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <!--o.0.1.c-->
        <article c-id="1.0.0.0">
          <slot-fb c-id="1.1.1.0" hidden="" s-sn="">
            <!--t.1.2.2.0-->
            Fallback content parent - should be hidden
          </slot-fb>
          <cmp-b c-id="0.1" class="hydrated" s-id="2" s-sn="">
            <!--r.2-->
            <section c-id="2.0.0.0">
              <slot-fb c-id="2.1.1.0" s-sn="">
                <!--t.2.2.2.0-->
                Fallback content child - should not be hidden
              </slot-fb>
              <p c-id="2.3.1.1">
                <!--t.2.4.2.0-->
                Non slot based content
              </p>
            </section>
          </cmp-b>
          <p c-id="1.3.1.1">
            <!--t.1.4.2.0-->
            Non slot based content
          </p>
        </article>
      </cmp-a>  
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root.outerHTML).toEqualHtml(`
      <cmp-a class="hydrated sc-cmp-a-h">
        <!--r.1-->
        <article class="sc-cmp-a sc-cmp-a-s">
          <slot-fb class="sc-cmp-a" hidden="">
            Fallback content parent - should be hidden
          </slot-fb>
          <cmp-b class="hydrated sc-cmp-b-h">
            <!--r.2-->
            <section class="sc-cmp-b sc-cmp-b-s">
              <slot-fb class="sc-cmp-b">
                Fallback content child - should not be hidden
              </slot-fb>
              <p class="sc-cmp-b">
                Non slot based content
              </p>
            </section>
          </cmp-b>
          <p class="sc-cmp-a">
            Non slot based content
          </p>
        </article>
      </cmp-a>
    `);
  });

  it('renders slot fallback text in a nested `shadow: true` component (`shadow: true` parent component)', async () => {
    @Component({
      tag: 'cmp-a',
      shadow: true,
    })
    class CmpA {
      render() {
        return (
          <article>
            <slot>Fallback content parent - should be hidden</slot>
            <p>Non slot based content</p>
          </article>
        );
      }
    }

    @Component({
      tag: 'cmp-b',
      shadow: true,
    })
    class CmpB {
      render() {
        return (
          <section>
            <slot>Fallback content child - should not be hidden</slot>
            <p>Non slot based content</p>
          </section>
        );
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: `<cmp-a><cmp-b></cmp-b></cmp-a>`,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <!--o.0.1.-->
        <article c-id="1.0.0.0">
          <slot-fb c-id="1.1.1.0" hidden="" s-sn="">
            <!--t.1.2.2.0-->
            Fallback content parent - should be hidden
          </slot-fb>
          <cmp-b c-id="0.1" class="hydrated" s-id="2" s-sn="">
            <!--r.2-->
            <section c-id="2.0.0.0">
              <slot-fb c-id="2.1.1.0" s-sn="">
                <!--t.2.2.2.0-->
                Fallback content child - should not be hidden
              </slot-fb>
              <p c-id="2.3.1.1">
                <!--t.2.4.2.0-->
                Non slot based content
              </p>
            </section>
          </cmp-b>
          <p c-id="1.3.1.1">
            <!--t.1.4.2.0-->
            Non slot based content 
          </p>
        </article>
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <mock:shadow-root>
          <article>
            <slot>
              Fallback content parent - should be hidden
            </slot>
            <p>
              Non slot based content
            </p>
          </article>
        </mock:shadow-root>
        <cmp-b class="hydrated">
          <mock:shadow-root>
            <section>
              <slot>
                Fallback content child - should not be hidden
              </slot>
              <p>
                Non slot based content
              </p>
            </section>
          </mock:shadow-root>
        </cmp-b>
      </cmp-a>  
    `);
  });

  it('does not show slot fallback text when a `scoped: true` component forwards the slot to nested `shadow: true`', async () => {
    @Component({
      tag: 'cmp-a',
      scoped: true,
    })
    class CmpA {
      render() {
        return (
          <article>
            <cmp-b>
              <slot>Fallback content parent - should be hidden</slot>
            </cmp-b>
          </article>
        );
      }
    }

    @Component({
      tag: 'cmp-b',
      shadow: true,
    })
    class CmpB {
      render() {
        return (
          <section>
            <slot>Fallback content child - should be hidden</slot>
          </section>
        );
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: `
      <cmp-a>
        <p>slotted item 1</p>
        <p>slotted item 2</p>
        <p>slotted item 3</p>
      </cmp-a>
      `,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <!--o.0.2.c-->
        <!--o.0.4.c-->
        <!--o.0.6.c-->
        <article c-id="1.0.0.0">
          <cmp-b c-id="1.1.1.0" class="hydrated" s-id="2">
            <!--r.2-->
            <!--o.1.2.-->
            <section c-id="2.0.0.0">
              <slot-fb c-id="2.1.1.0" hidden="" s-sn="">
                <!--t.2.2.2.0-->
                Fallback content child - should be hidden
              </slot-fb>
              <slot-fb c-id="1.2.2.0" hidden="" s-sn="">
                <!--t.1.3.3.0-->
                Fallback content parent - should be hidden
              </slot-fb>
              <p c-id="0.2" s-sn="">
                slotted item 1
              </p>
              <p c-id="0.4" s-sn="">
                slotted item 2
              </p>
              <p c-id="0.6" s-sn="">
                slotted item 3
              </p>
            </section>
          </cmp-b>
        </article>
      </cmp-a>  
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated sc-cmp-a-h">
        <!--r.1-->
        <article class="sc-cmp-a">
          <cmp-b class="hydrated sc-cmp-a sc-cmp-a-s">
            <mock:shadow-root>
              <section>
                <slot>
                  Fallback content child - should be hidden
                </slot>
              </section>
            </mock:shadow-root>
            <slot-fb class="sc-cmp-a" hidden="">
              Fallback content parent - should be hidden
            </slot-fb>
            <p>
              slotted item 1
            </p>
            <p>
              slotted item 2
            </p>
            <p>
              slotted item 3
            </p>
          </cmp-b>
        </article>
      </cmp-a>  
    `);
  });

  it('does not hide slot fallback text when a `scoped: true` component forwards the slot to nested `shadow: true`', async () => {
    @Component({
      tag: 'cmp-a',
      scoped: true,
    })
    class CmpA {
      render() {
        return (
          <article>
            <cmp-b>
              <slot>Fallback content parent - should be hidden</slot>
            </cmp-b>
          </article>
        );
      }
    }

    @Component({
      tag: 'cmp-b',
      shadow: true,
    })
    class CmpB {
      render() {
        return (
          <section>
            <slot>Fallback content child - should not be hidden</slot>
          </section>
        );
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: `
      <cmp-a></cmp-a>
      `,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class=\"hydrated\" s-id=\"1\">
        <!--r.1-->
        <article c-id=\"1.0.0.0\">
          <cmp-b c-id=\"1.1.1.0\" class=\"hydrated\" s-id=\"2\">
            <!--r.2-->
            <!--o.1.2.-->
            <section c-id=\"2.0.0.0\">
              <slot-fb c-id=\"2.1.1.0\" s-sn=\"\">
                <!--t.2.2.2.0-->
                Fallback content child - should not be hidden
              </slot-fb>
              <slot-fb c-id=\"1.2.2.0\" s-sn=\"\">
                <!--t.1.3.3.0-->
                Fallback content parent - should be hidden
              </slot-fb>
            </section>
          </cmp-b>
        </article>
      </cmp-a>  
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA, CmpB],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated sc-cmp-a-h">
        <!--r.1-->
        <article class="sc-cmp-a">
          <cmp-b class="hydrated sc-cmp-a sc-cmp-a-s">
            <mock:shadow-root>
              <section>
                <slot>
                  Fallback content child - should not be hidden
                </slot>
              </section>
            </mock:shadow-root>
            <slot-fb class="sc-cmp-a">
              Fallback content parent - should be hidden
            </slot-fb>
          </cmp-b>
        </article>
      </cmp-a>  
    `);
  });
});

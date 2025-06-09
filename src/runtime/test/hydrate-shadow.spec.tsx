import { Component, h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('hydrate, shadow', () => {
  it('light dom parent, nested shadow slot', async () => {
    @Component({
      tag: 'cmp-a',
    })
    class CmpA {
      render() {
        return <cmp-b>CmpALightDom</cmp-b>;
      }
    }

    @Component({
      tag: 'cmp-b',
      shadow: true,
    })
    class CmpB {
      render() {
        return (
          <article>
            <slot></slot>
          </article>
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
        <cmp-b c-id="1.0.0.0" class="hydrated" s-id="2">
          <!--r.2-->
          <!--o.1.1.-->
          <article c-id="2.0.0.0">
            <!--s.2.1.1.0.-->
            <!--t.1.1.1.0-->
            CmpALightDom
          </article>
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
          <mock:shadow-root>
            <article>
              <slot></slot>
            </article>
          </mock:shadow-root>
          CmpALightDom
        </cmp-b>
      </cmp-a>
    `);
  });

  it('light dom content, shadow slot', async () => {
    @Component({
      tag: 'cmp-a',
      shadow: true,
    })
    class CmpA {
      render() {
        return (
          <article>
            <section>
              <header>
                ShadowDom
                <svg></svg>
              </header>
              <div>
                <slot></slot>
              </div>
            </section>
          </article>
        );
      }
    }

    const serverHydrated = await newSpecPage({
      components: [CmpA],
      html: `
        <cmp-a>
          <div>
            <img>
            <p>LightDom1</p>
            <docs-button>
              <a>LightDom2</a>
            </docs-button>
          </div>
        </cmp-a>
      `,
      hydrateServerSide: true,
    });
    expect(serverHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <!--o.0.2.-->
        <article c-id="1.0.0.0">
          <section c-id="1.1.1.0">
            <header c-id="1.2.2.0">
              <!--t.1.3.3.0-->
              ShadowDom
              <svg c-id="1.4.3.1"></svg>
            </header>
            <div c-id="1.5.2.1">
              <!--s.1.6.3.0.-->
              <div c-id="0.2" s-sn="">
                <img>
                <p>
                  LightDom1
                </p>
                <docs-button>
                  <a>
                    LightDom2
                  </a>
                </docs-button>
              </div>
            </div>
          </section>
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
            <section>
              <header>
                ShadowDom
                <svg></svg>
              </header>
              <div>
                <slot></slot>
              </div>
            </section>
          </article>
        </mock:shadow-root>
        <div>
          <img>
          <p>
            LightDom1
          </p>
          <docs-button>
            <a>
              LightDom2
            </a>
          </docs-button>
        </div>
      </cmp-a>
    `);
  });
});

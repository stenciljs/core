import { Component, h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('hydrate style element', () => {
  it('style element text', async () => {
    @Component({ tag: 'cmp-a' })
    class CmpA {
      render() {
        return (h as any)('style', null, 'div { color: red; }');
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
        <style c-id="1.0.0.0">div { color: red; }</style>
      </cmp-a>
    `);

    const clientHydrated = await newSpecPage({
      components: [CmpA],
      html: serverHydrated.root.outerHTML,
      hydrateClientSide: true,
    });

    expect(clientHydrated.root).toEqualHtml(`
      <cmp-a class="hydrated">
        <!--r.1-->
        <style>div { color: red; }</style>
      </cmp-a>
    `);
  });
});

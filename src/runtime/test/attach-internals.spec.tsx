import { AttachInternals, Component, h, State } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('attachInternals', () => {
  it('runs a form-associated component during SSR', async () => {
    @Component({ tag: 'cmp-a', formAssociated: true })
    class CmpA {
      @AttachInternals({ states: { open: true } }) internals: ElementInternals;
      @State() loaded = false;

      componentWillLoad() {
        this.internals.setFormValue('value');
        this.internals.setValidity({ valueMissing: true }, 'Required');
        this.internals.checkValidity();
        this.internals.reportValidity();
        this.internals.ariaLabel = 'Label';
        this.loaded = true;
      }

      render() {
        return <div data-loaded={String(this.loaded)} />;
      }
    }

    const page = await newSpecPage({
      components: [CmpA],
      html: `<cmp-a></cmp-a>`,
      hydrateServerSide: true,
    });

    expect(page.root).toEqualHtml(`
      <cmp-a class="hydrated" s-id="1">
        <!--r.1-->
        <div c-id="1.0.0.0" data-loaded="true"></div>
      </cmp-a>
    `);
  });
});

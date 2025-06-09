import { Component, h, Prop } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

describe('scoped', () => {
  it('should add scoped classes', async () => {
    @Component({
      tag: 'cmp-a',
      styles: ':host { color: inherit }',
      scoped: true,
    })
    class CmpA {
      render() {
        return (
          <cmp-b>
            <span>Hola</span>
          </cmp-b>
        );
      }
    }

    @Component({
      tag: 'cmp-b',
      styles: ':host { color: inherit }',
      scoped: true,
    })
    class CmpB {
      render() {
        return (
          <div>
            <slot></slot>
          </div>
        );
      }
    }
    const page = await newSpecPage({
      components: [CmpA, CmpB],
      includeAnnotations: true,
      html: `<cmp-a></cmp-a>`,
    });

    expect(page.root).toEqualHtml(`
    <cmp-a class="hydrated sc-cmp-a-h">
      <cmp-b class="hydrated sc-cmp-a sc-cmp-b-h">
        <!---->
        <div class="sc-cmp-b sc-cmp-b-s">
          <span class="sc-cmp-a">
            Hola
          </span>
        </div>
      </cmp-b>
    </cmp-a>
    `);
  });

  it('should remove the scoped slot class when the slot is removed', async () => {
    @Component({
      tag: 'cmp-b',
      styles: ':host { color: inherit }',
      scoped: true,
    })
    class CmpB {
      @Prop() slot = true;

      render() {
        return (
          <div>
            {this.slot ? (
              <div key="one">
                <slot></slot>
              </div>
            ) : (
              <div key="two"></div>
            )}
          </div>
        );
      }
    }
    const page = await newSpecPage({
      components: [CmpB],
      includeAnnotations: true,
      html: `<cmp-b>hello</cmp-b>`,
    });

    expect(page.root).toEqualHtml(`
      <cmp-b class="hydrated sc-cmp-b-h">
        <!---->
        <div class="sc-cmp-b">
          <div class="sc-cmp-b sc-cmp-b-s">hello</div>
        </div>
      </cmp-b>
    `);

    page.root.slot = false;
    await page.waitForChanges();
    await page.waitForChanges();

    expect(page.root).toEqualHtml(`
      <cmp-b class="hydrated sc-cmp-b-h">
        <!---->
        <div class="sc-cmp-b">
          <div class="sc-cmp-b"></div>
        </div>
      </cmp-b>
    `);
  });
});

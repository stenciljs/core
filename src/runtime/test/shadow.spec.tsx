import { Component, h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

@Component({
  tag: 'cmp-a',
  styles: ':host { color: black }',
  shadow: true,
})
class CmpA {
  render() {
    return (
      <div>
        <slot name="start"></slot>
        <span>
          <slot />
        </span>
        <div class="end">
          <slot name="end"></slot>
        </div>
      </div>
    );
  }
}

describe('shadow', () => {
  it('render with shadow-dom enabled', async () => {
    const page = await newSpecPage({
      components: [CmpA],
      includeAnnotations: true,
      html: `
      <cmp-a>
        <span slot="end">End</span>
        Text
        <span slot="start">Start</span>
      </cmp-a>`,
    });

    expect(page.root).toEqualHtml(`
    <cmp-a class="hydrated">
      <mock:shadow-root>
        <div>
          <slot name=\"start\"></slot>
          <span>
            <slot></slot>
          </span>
          <div class='end'>
            <slot name='end'></slot>
          </div>
        </div>
      </mock:shadow-root>

      <span slot=\"end\">
        End
      </span>
      Text
      <span slot=\"start\">
        Start
      </span>
    </cmp-a>`);

    expect(page.root).toEqualLightHtml(`
    <cmp-a class="hydrated">
      <span slot=\"end\">
        End
      </span>
      Text
      <span slot=\"start\">
        Start
      </span>
    </cmp-a>`);
  });

  it('render scoped html with shadow-dom disabled', async () => {
    const page = await newSpecPage({
      components: [CmpA],
      supportsShadowDom: false,
      includeAnnotations: true,
      html: `
      <cmp-a>
        <span slot="end">End</span>
        Text
        <span slot="start">Start</span>
      </cmp-a>`,
    });

    const expected = `
    <cmp-a class="hydrated sc-cmp-a-h">
      <!---->
      <div class=\"sc-cmp-a sc-cmp-a-s\">
        <span class="sc-cmp-a" slot=\"start\">
          Start
        </span>
        <span class=\"sc-cmp-a sc-cmp-a-s\">
          Text
        </span>
        <div class="end sc-cmp-a sc-cmp-a-s">
          <span class="sc-cmp-a" slot=\"end\">
            End
          </span>
        </div>
      </div>
    </cmp-a>`;
    expect(page.root).toEqualHtml(expected);
    expect(page.root).toEqualLightHtml(expected);
  });

  it('render scoped html with shadow-dom disabled without annotations', async () => {
    const page = await newSpecPage({
      components: [CmpA],
      supportsShadowDom: false,
      html: `
      <cmp-a>
        <span slot="end">End</span>
        Text
        <span slot="start">Start</span>
      </cmp-a>`,
    });

    const expected = `
    <cmp-a>
      <div>
        <span slot=\"start\">
          Start
        </span>
        <span>
          Text
        </span>
        <div class='end'>
          <span slot=\"end\">
            End
          </span>
        </div>
      </div>
    </cmp-a>`;
    expect(page.root).toEqualHtml(expected);
    expect(page.root).toEqualLightHtml(expected);
  });

  it('test shadow root innerHTML', async () => {
    @Component({
      tag: 'cmp-a',
      shadow: true,
    })
    class CmpA {
      render() {
        return <div>Shadow Content</div>;
      }
    }

    const page = await newSpecPage({
      components: [CmpA],
      html: `
        <cmp-a>
          Light Content
        </cmp-a>
      `,
    });

    expect(page.root).toEqualHtml(`
      <cmp-a>
        <mock:shadow-root>
          <div>
            Shadow Content
          </div>
        </mock:shadow-root>
        Light Content
      </cmp-a>
    `);
  });
});

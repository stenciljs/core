import { newE2EPage } from '@stencil/core/testing';

describe('@Element', () => {
  it('should read the host elements attribute', async () => {
    // create a new puppeteer page
    const page = await newE2EPage({
      html: `
      <element-cmp host-element-attr="Marty McFly"></element-cmp>
    `,
    });

    // with page.find() select the "element-cmp" element (uses querySelector)
    const elm = await page.find('element-cmp');
    expect(elm).toEqualText('Hello, my name is Marty McFly');
  });

  it('should correctly expect attrs and classes', async () => {
    const page = await newE2EPage({
      html: `
      <element-cmp data-attr1="a" data-attr2="b" class="class1 class2"></element-cmp>
    `,
    });

    const elm = await page.find('element-cmp');

    expect(elm).toHaveAttribute('data-attr1');
    expect(elm).not.toHaveAttribute('data-attr3');

    expect(elm).toEqualAttribute('data-attr2', 'b');
    expect(elm).not.toEqualAttribute('data-attr2', 'c');

    expect(elm).toHaveClass('class1');
    expect(elm).not.toHaveClass('class3');
  });

  it('should set innerHTML', async () => {
    const page = await newE2EPage({
      html: `
      <element-cmp id="my-elm"></element-cmp>
    `,
    });

    const elm = await page.find('#my-elm');

    elm.innerHTML = '<div>inner content</div>';

    await page.waitForChanges();

    expect(elm).toEqualHtml(`
      <element-cmp id="my-elm" custom-hydrate-flag="">
        <div>
          inner content
        </div>
      </element-cmp>
    `);

    expect(elm).toEqualText('inner content');
  });

  it('should get computed styles of CSS vars assigned on host element', async () => {
    const page = await newE2EPage({
      html: `
      <element-cmp id="my-elm" style="--my-component-text-color: rgb(255, 0, 0);"></element-cmp>
    `,
    });
    const el = await page.find('element-cmp');
    expect((await el.getComputedStyle()).getPropertyValue('--my-component-text-color')).toEqual('rgb(255, 0, 0)');
  });
});

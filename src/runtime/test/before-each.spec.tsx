import { newSpecPage } from '@stencil/core/testing';

import { CmpA } from './fixtures/cmp-a';

describe('newSpecPage, spec testing', () => {
  let page: any;
  let root: any;

  beforeEach(async () => {
    page = await newSpecPage({
      components: [CmpA],
      includeAnnotations: true,
      html: '<cmp-a></cmp-a>',
    });
    root = page.root;
  });

  it('renders changes when first property is given', async () => {
    root.first = 'John';
    await page.waitForChanges();

    const div = root.shadowRoot.querySelector('div');
    expect(div.textContent).toEqual(`Hello, World! I'm John`);
  });

  it('renders changes when first and last properties are given', async () => {
    root.first = 'Marty';
    root.last = 'McFly';
    await page.waitForChanges();

    const div = root.shadowRoot.querySelector('div');
    expect(div.textContent).toEqual(`Hello, World! I'm Marty McFly`);
  });

  it('renders changes to the name data', async () => {
    expect(root).toEqualHtml(`
      <cmp-a class="hydrated">
        <mock:shadow-root>
          <div>
            Hello, World! I'm
          </div>
        </mock:shadow-root>
      </cmp-a>
    `);
    expect(root).toHaveClass('hydrated');
    const div = root.shadowRoot.querySelector('div');
    expect(div.textContent).toEqual(`Hello, World! I'm `);

    root.first = 'Doc';
    await page.waitForChanges();
    expect(div.textContent).toEqual(`Hello, World! I'm Doc`);

    root.last = 'Brown';
    await page.waitForChanges();
    expect(div.textContent).toEqual(`Hello, World! I'm Doc Brown`);

    root.middle = 'Emmett';
    await page.waitForChanges();
    expect(div.textContent).toEqual(`Hello, World! I'm Doc Emmett Brown`);
  });

  it('should emit "initevent" on init', async () => {
    root.addEventListener(
      'initevent',
      (ev: CustomEvent) => {
        expect(ev.detail.init).toBeTruthy();
      },
      false,
    );
    root.init();
    await page.waitForChanges();
  });

  it('should respond to "testevent"', async () => {
    const myevent = new CustomEvent('testevent', {
      detail: {
        last: 'Jeep',
      },
    });
    page.doc.dispatchEvent(myevent);
    await page.waitForChanges();
    const div = root.shadowRoot.querySelector('div');
    expect(div.textContent).toEqual(`Hello, World! I'm  Jeep`);
  });
});

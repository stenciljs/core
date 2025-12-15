import { newE2EPage } from '@stencil/core/testing';

describe('dom api e2e tests', () => {
  it('should add css classes', async () => {
    const page = await newE2EPage({
      html: `
      <dom-api class="class-a"></dom-api>
    `,
    });

    const elm = await page.find('.class-a');

    expect(elm).toHaveClass('class-a');
    expect(elm).not.toHaveClass('class-b');
    expect(elm.className).toBe('class-a');

    elm.classList.add('class-b', 'class-c');

    expect(() => {
      // because we changed the element, we can't read
      // element info until we wait for changes, which is
      // why this call would throw an error
      expect(elm).toHaveClasses(['class-a', 'class-b', 'class-c']);
    }).toThrow();

    // we added css classes, so we have to want for the changes to apply
    await page.waitForChanges();

    expect(elm).toHaveClass('class-a');
    expect(elm).toHaveClass('class-b');
    expect(elm).toHaveClass('class-c');
    expect(elm).not.toHaveClass('class-d');

    expect(elm).toHaveClasses(['class-a', 'class-b', 'class-c']);

    expect(elm).not.toHaveClasses(['class-d', 'class-e']);

    expect(elm.classList.contains('class-a')).toBe(true);
    expect(elm.classList.contains('class-b')).toBe(true);
    expect(elm.classList.contains('class-c')).toBe(true);
    expect(elm.classList.contains('class-d')).toBe(false);

    expect(elm.className).toBe('class-a class-b class-c');
  });

  it('should remove css classes', async () => {
    const page = await newE2EPage({
      html: `
      <dom-api class="class-a"></dom-api>
    `,
    });

    const elm = await page.find('.class-a');

    await page.waitForChanges();

    elm.classList.add('class-b', 'class-c');

    elm.classList.remove('class-c');

    // we added css classes, so we have to want for the changes to apply
    await page.waitForChanges();

    expect(elm).toHaveClass('class-a');
    expect(elm).toHaveClass('class-b');
    expect(elm).not.toHaveClass('class-c');

    expect(elm).toHaveClasses(['class-a', 'class-b']);
    expect(elm).not.toHaveClasses(['class-c']);
  });

  it('should toggles css classes', async () => {
    const page = await newE2EPage({
      html: `
      <dom-api class="class-a"></dom-api>
    `,
    });

    const elm = await page.find('.class-a');

    await page.waitForChanges();

    elm.classList.toggle('class-a');

    elm.classList.toggle('class-b');

    await page.waitForChanges();

    expect(elm).toHaveClasses(['class-b']);
    expect(elm).not.toHaveClasses(['class-a']);
  });

  it('should set id', async () => {
    const page = await newE2EPage({
      html: `
      <dom-api id="my-cmp"></dom-api>
    `,
    });

    const elm = await page.find('#my-cmp');

    expect(elm.id).toBe('my-cmp');

    elm.id = 'my-changed-id';

    await page.waitForChanges();

    expect(elm.id).toBe('my-changed-id');
  });

  it('should get/set attributes', async () => {
    const page = await newE2EPage({
      html: `
      <dom-api id="my-cmp" mph="88"></dom-api>
    `,
    });

    const elm = await page.find('#my-cmp');

    expect(elm).toHaveAttribute('id');
    expect(elm).toHaveAttribute('mph');
    expect(elm).not.toHaveAttribute('whatever');

    expect(elm).toEqualAttribute('id', 'my-cmp');
    expect(elm).toEqualAttribute('mph', 88);

    expect(elm).toEqualAttributes({
      id: 'my-cmp',
      mph: 88,
    });

    expect(elm.getAttribute('id')).toBe('my-cmp');
    expect(elm.getAttribute('mph')).toBe('88');
    expect(elm).not.toHaveAttribute('enabled');

    elm.setAttribute('id', 'my-changed-id');
    elm.setAttribute('town', 'hill valley');
    elm.toggleAttribute('enabled');

    await page.waitForChanges();

    expect(elm).toHaveAttribute('id');
    expect(elm).toEqualAttribute('id', 'my-changed-id');
    expect(elm).toEqualAttributes({
      id: 'my-changed-id',
      mph: '88',
    });
    expect(elm).toHaveAttribute('town');
    expect(elm).toHaveAttribute('enabled');

    elm.removeAttribute('town');
    elm.toggleAttribute('enabled');
    await page.waitForChanges();
    expect(elm).not.toHaveAttribute('town');
    expect(elm).not.toHaveAttribute('enabled');
  });

  it('should test html', async () => {
    const page = await newE2EPage({
      html: `
      <dom-api></dom-api>
    `,
    });

    const elm = await page.find('dom-api');

    expect(elm).toEqualHtml(`
      <dom-api custom-hydrate-flag="">
        <span data-z="z" class="red green blue" data-a="a">
          dom api
        </span>
      </dom-api>
    `);

    expect(elm.innerHTML).toEqualHtml(`
      <span class="red   green blue"
      data-z="z" data-a="a"
      >dom \n\napi</span>
    `);

    expect(elm.innerHTML).toEqualHtml(`
      <span data-a="a" class="red blue green    " data-z="z">
      dom       api
      </span>
    `);

    expect(elm.innerHTML).toEqualHtml(`
    <span data-z="z" class="  green red   blue    " data-a="a" >
                      dom  api
          </span>
    `);

    elm.innerHTML = '<div>changed content</div>';

    await page.waitForChanges();

    expect(elm).toEqualHtml(`
      <dom-api custom-hydrate-flag="">
        <div>changed content</div>
      </dom-api>
    `);

    expect(elm.outerHTML).toEqualHtml(`
      <dom-api custom-hydrate-flag="">
        <div>changed content</div>
      </dom-api>
    `);

    expect(elm.innerHTML).toEqualHtml(`
      <div>changed content</div>
    `);

    expect(() => {
      elm.outerHTML = '<div>me error</div>';
    }).toThrow();
  });

  it('should test textContent', async () => {
    const page = await newE2EPage({
      html: `
      <dom-api></dom-api>
    `,
    });

    const elm = await page.find('dom-api');

    expect(elm).toEqualText(`
      dom api
    `);

    expect(elm.textContent).toEqualText(`
      dom api
    `);

    expect(elm.textContent).toEqualText(`
    dom     \n\n api\n\n
    `);

    elm.textContent = 'updated text content';

    await page.waitForChanges();

    expect(elm).toEqualText(`
      updated text content
    `);

    expect(elm).toEqualHtml(`
      <dom-api custom-hydrate-flag="">
        updated text content
      </dom-api>
    `);

    elm.click;

    expect(elm.nodeType).toBe(1);
    expect(elm.nodeName).toBe(`DOM-API`);
    expect(elm.tagName).toBe(`DOM-API`);
  });
});

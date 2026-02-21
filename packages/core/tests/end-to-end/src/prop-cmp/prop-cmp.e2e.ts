import { newE2EPage, E2EPage } from '@stencil/core/testing';

describe('@Prop', () => {
  let page: E2EPage;
  beforeEach(async () => {
    // example showing how new test pages can be
    // created within beforeEach(), then using
    // page.setTestContent() or page.gotoTest()
    page = await newE2EPage();
  });

  it('should set props from property', async () => {
    // create a new puppeteer page
    // load the page with html content
    await page.setContent(`
      <prop-cmp mode="ios"></prop-cmp>
    `);

    // select the "prop-cmp" element
    // and run the callback in the browser's context
    await page.$eval('prop-cmp', (elm: any) => {
      // within the browser's context
      // let's set new property values on the component
      elm.first = 'Marty';
      elm.lastName = 'McFly';
      elm.clothes = 'down filled jackets';
    });

    // we just made a change and now the async queue need to process it
    // make sure the queue does its work before we continue
    await page.waitForChanges();

    // select the "prop-cmp" element within the page (same as querySelector)
    const elm = await page.find('prop-cmp >>> div');
    expect(elm).toEqualText(
      'Hello, my name is Marty McFly. My full name being Mr Marty McFly. I like to wear down filled jackets.',
    );
  });

  it('should set props from attributes', async () => {
    await page.setContent(`
      <prop-cmp first="Marty" last-name="McFly" mode="ios" clothes="down filled jackets"></prop-cmp>
    `);

    const elm = await page.find('prop-cmp >>> div');
    expect(elm).toEqualText(
      'Hello, my name is Marty McFly. My full name being Mr Marty McFly. I like to wear down filled jackets.',
    );
  });

  it('should not set read-only props', async () => {
    await page.setContent(`
      <prop-cmp first="Marty" last-name="McFly" mode="ios" clothes="shoes"></prop-cmp>
    `);

    const elm = await page.find('prop-cmp >>> div');
    expect(elm).toEqualText(
      'Hello, my name is Marty McFly. My full name being Mr Marty McFly. I like to wear life preservers.',
    );
  });

  it('should not set read-only props or override conditional setters', async () => {
    await page.setContent(`
      <prop-cmp first="Marty" last-name="McFly" fullName="Biff Tannen" mode="ios" clothes="shoes"></prop-cmp>
    `);

    const elm = await page.find('prop-cmp >>> div');
    expect(elm).toEqualText(
      'Hello, my name is Marty McFly. My full name being Mr Marty McFly. I like to wear life preservers.',
    );
  });
});

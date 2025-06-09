import { newE2EPage } from '@stencil/core/testing';

describe('goto root url', () => {
  it('have custom hydrate flags and css', async () => {
    const page = await newE2EPage({ url: '/' });

    const elm = await page.find('app-root');
    expect(elm).toHaveAttribute('custom-hydrate-flag');

    const elmStyle = await elm.getComputedStyle();
    expect(elmStyle.opacity).toBe('1');

    const headStyleElm = await page.find('head style[data-styles]');
    expect(headStyleElm.innerHTML).toContain('{opacity:0}[custom-hydrate-flag]{opacity:1}');
  });

  it('should navigate to the index.html page w/out url searchParams', async () => {
    // create a new puppeteer page
    // and go to the root webpage
    const page = await newE2EPage({ url: '/' });

    // select the "prop-cmp" element within the page (same as querySelector)
    // and once it's received, then return the element's "textContent" property
    const elm = await page.find('prop-cmp >>> div');
    expect(elm).toEqualText(
      'Hello, my name is Stencil JS. My full name being Mr Stencil JS. I like to wear life preservers.',
    );

    await page.compareScreenshot('navigate to homepage', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 400, height: 250 },
      omitBackground: true,
    });
  });

  it('should navigate to the index.html page with custom url searchParams', async () => {
    // create a new puppeteer page
    const page = await newE2EPage({
      url: '/?first=Doc&last=Brown&clothes=lab coats',
    });

    const elm = await page.find('prop-cmp >>> div');
    expect(elm).toEqualText('Hello, my name is Doc Brown. My full name being Mr Doc Brown. I like to wear lab coats.');

    await page.compareScreenshot('navigate to homepage with querystrings');
  });

  it('should apply global style when navigating to root page', async () => {
    const page = await newE2EPage({
      url: '/',
    });

    const elm = await page.find('app-root');
    const elmStyle = await elm.getComputedStyle();

    expect(elmStyle.borderColor).toBe('rgb(255, 0, 0)');
    expect(elmStyle.borderWidth).toBe('5px');
    expect(elmStyle.borderStyle).toBe('dotted');
  });

  it('should apply global style when setting html', async () => {
    const page = await newE2EPage({
      url: '/',
    });

    const elm = await page.find('app-root');
    const elmStyle = await elm.getComputedStyle();

    expect(elmStyle.borderColor).toBe('rgb(255, 0, 0)');
    expect(elmStyle.borderWidth).toBe('5px');
    expect(elmStyle.borderStyle).toBe('dotted');

    const videoElm = await page.find('#video');
    const videoStyle = await videoElm.getComputedStyle();

    // @Component() styles
    expect(videoStyle.borderColor).toBe('rgb(0, 0, 255)');
    expect(videoStyle.borderWidth).toBe('2px');

    // linaria styles
    expect(videoStyle.backgroundColor).toBe('rgba(0, 0, 255, 0.1)');
  });
});

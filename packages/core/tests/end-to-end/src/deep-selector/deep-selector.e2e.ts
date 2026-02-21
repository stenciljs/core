import { newE2EPage } from '@stencil/core/testing';

describe('Shadow DOM piercing', () => {
  it('can pierce through shadow DOM via Puppeteer primitives', async () => {
    // create a new puppeteer page
    const page = await newE2EPage({
      html: `
        <cmp-a></cmp-a>
      `,
    });

    const spanCmpA = await page.$('cmp-a >>> span');
    expect(await spanCmpA.evaluate((el) => el.textContent)).toBe('I am in component A');
    const spanCmpB = await page.$('cmp-a >>> cmp-b >>> span');
    expect(await spanCmpB.evaluate((el) => el.textContent)).toBe('I am in component B');
    const spanCmpC = await page.$('cmp-a >>> cmp-b >>> cmp-c >>> span');
    expect(await spanCmpC.evaluate((el) => el.textContent)).toBe('I am in component C');

    // we skip through the shadow dom
    const spanCmp = await page.$('cmp-a >>> cmp-c >>> span');
    expect(await spanCmp.evaluate((el) => el.textContent)).toBe('I am in component C');
  });

  it('can pierce through shadow DOM via Stencil E2E testing API', async () => {
    // create a new puppeteer page
    const page = await newE2EPage({
      html: `
        <cmp-a></cmp-a>
      `,
    });

    const spanCmpA = await page.find('cmp-a >>> span');
    expect(spanCmpA.textContent).toBe('I am in component A');
    const spanCmpB = await page.find('cmp-a >>> cmp-b >>> span');
    expect(spanCmpB.textContent).toBe('I am in component B');
    const spanCmpC = await page.find('cmp-a >>> div > cmp-b >>> div cmp-c >>> span');
    expect(spanCmpC.textContent).toBe('I am in component C');

    // we skip through the shadow dom
    const spanCmp = await page.find('cmp-a >>> cmp-c >>> span');
    expect(spanCmp.textContent).toBe('I am in component C');
  });

  it('can pierce through shadow DOM via findAll', async () => {
    // create a new puppeteer page
    const page = await newE2EPage({
      html: `
        <cmp-a></cmp-a>
      `,
    });

    const spans = await page.findAll('cmp-a >>> span');
    expect(spans).toHaveLength(3);
    expect(spans[0].textContent).toBe('I am in component A');
    expect(spans[1].textContent).toBe('I am in component B');
    expect(spans[2].textContent).toBe('I am in component C');

    const spansCmpB = await page.findAll('cmp-a >>> cmp-b >>> span');
    expect(spansCmpB).toHaveLength(2);
    expect(spansCmpB[0].textContent).toBe('I am in component B');
    expect(spansCmpB[1].textContent).toBe('I am in component C');

    const spansCmpC = await page.findAll('cmp-a >>> cmp-b >>> cmp-c >>> span');
    expect(spansCmpC).toHaveLength(1);
    expect(spansCmpC[0].textContent).toBe('I am in component C');

    // we skip through the shadow dom
    const spansCmp = await page.findAll('cmp-a >>> cmp-c >>> span');
    expect(spansCmp).toHaveLength(1);
    expect(spansCmp[0].textContent).toBe('I am in component C');
  });
});

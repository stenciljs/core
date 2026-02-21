import { type E2EPage, newE2EPage } from '@stencil/core/testing';

let page: E2EPage;

function checkSorted(arr: string[]) {
  return arr.every((value, index, array) => index === 0 || value >= array[index - 1]);
}

describe('do not throw page already closed if page was defined in before(All) hook', () => {
  beforeAll(async () => {
    page = await newE2EPage();
  });

  it('first test', async () => {
    const p = await page.find('html');
    expect(p).not.toBeNull();
  });

  it('second test', async () => {
    const p = await page.find('html');
    expect(p).not.toBeNull();
  });
});

describe('sorts hydrated component styles', () => {
  it('generates style tags in alphabetical order', async () => {
    page = await newE2EPage();
    expect(await page.evaluate(() => document.querySelectorAll('style').length)).toBe(0);
    await page.setContent(`
      <prop-cmp mode="ios"></prop-cmp>
    `);
    expect(await page.evaluate(() => document.querySelectorAll('style').length)).toBe(1);

    const styleContent = await page.evaluate(() => document.querySelector('style').innerHTML);

    /**
     * filter out the hydration class selector for the app-root component
     */
    const classSelector = styleContent
      .replace(/\}/g, '}\n')
      .trim()
      .split('\n')
      .map((c) => c.slice(0, c.indexOf('{')))
      .find((c) => c.includes('app-root'));
    expect(checkSorted(classSelector.split(','))).toBeTruthy();
  });
});

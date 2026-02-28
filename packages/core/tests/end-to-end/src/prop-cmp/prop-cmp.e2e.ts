import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('@Prop', () => {
  test('should set props from property', async ({ page }) => {
    // load the page with html content
    await page.setContent(`
      <prop-cmp mode="ios"></prop-cmp>
    `);

    // select the "prop-cmp" element
    // and run the callback in the browser's context
    await page.locator('prop-cmp').evaluate((elm: any) => {
      // within the browser's context
      // let's set new property values on the component
      elm.first = 'Marty';
      elm.lastName = 'McFly';
      elm.clothes = 'down filled jackets';
    });

    // we just made a change and now the async queue need to process it
    // make sure the queue does its work before we continue
    await page.waitForChanges();

    // select the "prop-cmp" element within the page (Playwright pierces shadow DOM by default)
    const elm = page.locator('prop-cmp').locator('div');
    await expect(elm).toHaveText(
      'Hello, my name is Marty McFly. My full name being Mr Marty McFly. I like to wear down filled jackets.',
    );
  });

  test('should set props from attributes', async ({ page }) => {
    await page.setContent(`
      <prop-cmp first="Marty" last-name="McFly" mode="ios" clothes="down filled jackets"></prop-cmp>
    `);

    const elm = page.locator('prop-cmp').locator('div');
    await expect(elm).toHaveText(
      'Hello, my name is Marty McFly. My full name being Mr Marty McFly. I like to wear down filled jackets.',
    );
  });

  test('should not set read-only props', async ({ page }) => {
    await page.setContent(`
      <prop-cmp first="Marty" last-name="McFly" mode="ios" clothes="shoes"></prop-cmp>
    `);

    const elm = page.locator('prop-cmp').locator('div');
    await expect(elm).toHaveText(
      'Hello, my name is Marty McFly. My full name being Mr Marty McFly. I like to wear life preservers.',
    );
  });

  test('should not set read-only props or override conditional setters', async ({ page }) => {
    await page.setContent(`
      <prop-cmp first="Marty" last-name="McFly" fullName="Biff Tannen" mode="ios" clothes="shoes"></prop-cmp>
    `);

    const elm = page.locator('prop-cmp').locator('div');
    await expect(elm).toHaveText(
      'Hello, my name is Marty McFly. My full name being Mr Marty McFly. I like to wear life preservers.',
    );
  });
});

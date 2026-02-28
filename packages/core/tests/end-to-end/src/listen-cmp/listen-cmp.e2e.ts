import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('@Listen', () => {
  test('host listener toggles "opened" from "click" event', async ({ page }) => {
    await page.setContent(`
      <listen-cmp></listen-cmp>
    `);

    const elm = page.locator('listen-cmp');

    await page.waitForChanges();

    // test that the initial "opened" property is false
    let opened = await elm.evaluate((el: any) => el.opened);
    expect(opened).toEqual(false);

    // simulated "click" event triggered from the element
    await elm.click();

    await page.waitForChanges();

    // test that the event correctly triggered the component's @Listen('click') handler
    // which should have changed the "opened" value to true
    opened = await elm.evaluate((el: any) => el.opened);
    expect(opened).toEqual(true);

    // let's do it again!
    await elm.click();

    await page.waitForChanges();

    // let's get the value of "opened" again
    opened = await elm.evaluate((el: any) => el.opened);
    expect(opened).toEqual(false);
  });
});

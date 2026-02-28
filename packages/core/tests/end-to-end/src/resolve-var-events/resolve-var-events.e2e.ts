import { expect } from '@playwright/test';
import { E2ELocator, test } from '@stencil/playwright';

test.describe('resolveVar with @Event and @Listen', () => {
  test('should fire and listen to event with resolved const variable', async ({ page }) => {
    await page.setContent(`
      <resolve-var-events></resolve-var-events>
    `);

    const elm = page.locator('resolve-var-events') as E2ELocator;
    await page.waitForChanges();

    const eventSpy = await elm.spyOnEvent('myEvent');

    await elm.evaluate((el: any) => el.emitMyEvent());

    await page.waitForChanges();

    expect(eventSpy).toHaveReceivedEvent();
    const myEventCount = page.locator('resolve-var-events').locator('.my-event-count');
    await expect(myEventCount).toHaveText('1');
  });

  test('should fire and listen to event with resolved object property', async ({ page }) => {
    await page.setContent(`
      <resolve-var-events></resolve-var-events>
    `);

    const elm = page.locator('resolve-var-events') as E2ELocator;
    await page.waitForChanges();

    const eventSpy = await elm.spyOnEvent('otherEvent');

    await elm.evaluate((el: any) => el.emitOtherEvent());

    await page.waitForChanges();

    expect(eventSpy).toHaveReceivedEvent();
    const otherEventCount = page.locator('resolve-var-events').locator('.other-event-count');
    await expect(otherEventCount).toHaveText('1');
  });

  test('should handle multiple events with different resolved variables', async ({ page }) => {
    await page.setContent(`
      <resolve-var-events></resolve-var-events>
    `);

    const elm = page.locator('resolve-var-events');
    await page.waitForChanges();

    await elm.evaluate((el: any) => el.emitMyEvent());
    await page.waitForChanges();

    await elm.evaluate((el: any) => el.emitOtherEvent());
    await page.waitForChanges();

    const myEventCount = page.locator('resolve-var-events').locator('.my-event-count');
    const otherEventCount = page.locator('resolve-var-events').locator('.other-event-count');

    await expect(myEventCount).toHaveText('1');
    await expect(otherEventCount).toHaveText('1');
  });
});

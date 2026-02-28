import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('@Method', () => {
  test('should pass method args', async ({ page }) => {
    await page.setContent(`
      <method-cmp></method-cmp>
    `);

    const elm = page.locator('method-cmp');

    // Call component method with arguments via evaluate
    const methodRtnValue = await elm.evaluate((el: any) => el.someMethodWithArgs('mph', 88));

    expect(methodRtnValue).toBe('88 mph');
  });

  test('should set property thats used in a method', async ({ page }) => {
    await page.setContent(`
      <method-cmp></method-cmp>
    `);

    const elm = page.locator('method-cmp');

    // Set property and call method via evaluate
    await elm.evaluate((el: any) => {
      el.someProp = 88;
    });

    const methodRtnValue = await elm.evaluate((el: any) => el.someMethod());

    expect(methodRtnValue).toBe(88);
  });
});

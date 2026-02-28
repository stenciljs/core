import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('@Element', () => {
  test('should read the host elements attribute', async ({ page }) => {
    await page.setContent(`
      <element-cmp host-element-attr="Marty McFly"></element-cmp>
    `);

    const elm = page.locator('element-cmp');
    await expect(elm).toHaveText('Hello, my name is Marty McFly');
  });

  test('should correctly expect attrs and classes', async ({ page }) => {
    await page.setContent(`
      <element-cmp data-attr1="a" data-attr2="b" class="class1 class2"></element-cmp>
    `);

    const elm = page.locator('element-cmp');

    await expect(elm).toHaveAttribute('data-attr1');
    await expect(elm).not.toHaveAttribute('data-attr3');

    await expect(elm).toHaveAttribute('data-attr2', 'b');

    await expect(elm).toHaveClass(/class1/);
    await expect(elm).not.toHaveClass(/class3/);
  });

  test('should set innerHTML', async ({ page }) => {
    await page.setContent(`
      <element-cmp id="my-elm"></element-cmp>
    `);

    const elm = page.locator('#my-elm');

    await elm.evaluate((el) => {
      el.innerHTML = '<div>inner content</div>';
    });

    await page.waitForChanges();

    await expect(elm).toHaveAttribute('custom-hydrate-flag', '');
    await expect(elm.locator('div')).toHaveText('inner content');
    await expect(elm).toHaveText('inner content');
  });

  test('should get computed styles of CSS vars assigned on host element', async ({ page }) => {
    await page.setContent(`
      <element-cmp id="my-elm" style="--my-component-text-color: rgb(255, 0, 0);"></element-cmp>
    `);

    const el = page.locator('element-cmp');
    const cssVarValue = await el.evaluate((elem) => {
      return getComputedStyle(elem).getPropertyValue('--my-component-text-color');
    });

    expect(cssVarValue.trim()).toEqual('rgb(255, 0, 0)');
  });
});

import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

import { CarData } from './car-data';

test.describe('car-list', () => {
  test('should work without parameters', async ({ page }) => {
    await page.setContent(`
      <car-list></car-list>
    `);

    const elm = page.locator('car-list');

    // Verify the component has the hydrate flag attribute
    await expect(elm).toHaveAttribute('custom-hydrate-flag', '');

    // Verify shadow root is empty initially
    const shadowContent = await elm.evaluate((el) => el.shadowRoot?.innerHTML.trim() ?? '');
    expect(shadowContent).toBe('');

    // Verify innerHTML is empty (no light DOM content)
    const innerHTML = await elm.evaluate((el) => el.innerHTML.trim());
    expect(innerHTML).toBe('');
  });

  test('should set car list data', async ({ page }) => {
    await page.setContent(`
      <car-list></car-list>
    `);

    const elm = page.locator('car-list');

    const cars: CarData[] = [
      new CarData('Cord', 'Model 812', 1934),
      new CarData('Duesenberg', 'SSJ', 1935),
      new CarData('Alfa Romeo', '2900 8c', 1938),
    ];

    // Set the cars property
    await elm.evaluate((el: any, carsData) => {
      el.cars = carsData;
    }, cars);

    await page.waitForChanges();

    // Verify the component rendered the car list
    const listItems = page.locator('car-list').locator('li');
    await expect(listItems).toHaveCount(3);

    // Verify each car detail is rendered correctly
    const carDetails = page.locator('car-list').locator('car-detail');
    await expect(carDetails).toHaveCount(3);

    // Check the text content of each car detail
    await expect(carDetails.nth(0).locator('section')).toHaveText('1934 Cord Model 812');
    await expect(carDetails.nth(1).locator('section')).toHaveText('1935 Duesenberg SSJ');
    await expect(carDetails.nth(2).locator('section')).toHaveText('1938 Alfa Romeo 2900 8c');

    // Verify innerHTML is still empty (all content is in shadow DOM)
    const innerHTML = await elm.evaluate((el) => el.innerHTML.trim());
    expect(innerHTML).toBe('');
  });
});

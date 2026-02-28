import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('dom api e2e tests', () => {
  test('should add css classes', async ({ page }) => {
    await page.setContent(`
      <dom-api class="class-a"></dom-api>
    `);

    const elm = page.locator('.class-a');

    await expect(elm).toHaveClass(/class-a/);
    await expect(elm).not.toHaveClass(/class-b/);

    // Add classes via evaluate
    await elm.evaluate((el) => {
      el.classList.add('class-b', 'class-c');
    });

    await page.waitForChanges();

    await expect(elm).toHaveClass(/class-a/);
    await expect(elm).toHaveClass(/class-b/);
    await expect(elm).toHaveClass(/class-c/);
    await expect(elm).not.toHaveClass(/class-d/);

    // Check classList contains
    const hasClasses = await elm.evaluate((el) => ({
      a: el.classList.contains('class-a'),
      b: el.classList.contains('class-b'),
      c: el.classList.contains('class-c'),
      d: el.classList.contains('class-d'),
    }));

    expect(hasClasses.a).toBe(true);
    expect(hasClasses.b).toBe(true);
    expect(hasClasses.c).toBe(true);
    expect(hasClasses.d).toBe(false);

    const className = await elm.evaluate((el) => el.className);
    expect(className).toBe('class-a class-b class-c');
  });

  test('should remove css classes', async ({ page }) => {
    await page.setContent(`
      <dom-api class="class-a"></dom-api>
    `);

    const elm = page.locator('.class-a');

    await page.waitForChanges();

    await elm.evaluate((el) => {
      el.classList.add('class-b', 'class-c');
      el.classList.remove('class-c');
    });

    await page.waitForChanges();

    await expect(elm).toHaveClass(/class-a/);
    await expect(elm).toHaveClass(/class-b/);
    await expect(elm).not.toHaveClass(/class-c/);
  });

  test('should toggle css classes', async ({ page }) => {
    await page.setContent(`
      <dom-api class="class-a"></dom-api>
    `);

    const elm = page.locator('.class-a');

    await page.waitForChanges();

    await elm.evaluate((el) => {
      el.classList.toggle('class-a');
      el.classList.toggle('class-b');
    });

    await page.waitForChanges();

    await expect(elm).toHaveClass(/class-b/);
    await expect(elm).not.toHaveClass(/class-a/);
  });

  test('should set id', async ({ page }) => {
    await page.setContent(`
      <dom-api id="my-cmp"></dom-api>
    `);

    const elm = page.locator('#my-cmp');

    const id = await elm.evaluate((el) => el.id);
    expect(id).toBe('my-cmp');

    await elm.evaluate((el) => {
      el.id = 'my-changed-id';
    });

    await page.waitForChanges();

    const newId = await page.locator('#my-changed-id').evaluate((el) => el.id);
    expect(newId).toBe('my-changed-id');
  });

  test('should get/set attributes', async ({ page }) => {
    await page.setContent(`
      <dom-api id="my-cmp" mph="88"></dom-api>
    `);

    const elm = page.locator('#my-cmp');

    await expect(elm).toHaveAttribute('id');
    await expect(elm).toHaveAttribute('mph');
    await expect(elm).not.toHaveAttribute('whatever');

    await expect(elm).toHaveAttribute('id', 'my-cmp');
    await expect(elm).toHaveAttribute('mph', '88');

    const attrs = await elm.evaluate((el) => ({
      id: el.getAttribute('id'),
      mph: el.getAttribute('mph'),
    }));
    expect(attrs.id).toBe('my-cmp');
    expect(attrs.mph).toBe('88');

    await expect(elm).not.toHaveAttribute('enabled');

    await elm.evaluate((el) => {
      el.setAttribute('id', 'my-changed-id');
      el.setAttribute('town', 'hill valley');
      el.toggleAttribute('enabled');
    });

    await page.waitForChanges();

    const changedElm = page.locator('#my-changed-id');
    await expect(changedElm).toHaveAttribute('id', 'my-changed-id');
    await expect(changedElm).toHaveAttribute('town');
    await expect(changedElm).toHaveAttribute('enabled');

    await changedElm.evaluate((el) => {
      el.removeAttribute('town');
      el.toggleAttribute('enabled');
    });

    await page.waitForChanges();

    await expect(changedElm).not.toHaveAttribute('town');
    await expect(changedElm).not.toHaveAttribute('enabled');
  });

  test('should test html', async ({ page }) => {
    await page.setContent(`
      <dom-api></dom-api>
    `);

    const elm = page.locator('dom-api');

    // Check that element has the expected structure
    await expect(elm).toHaveAttribute('custom-hydrate-flag', '');
    const span = elm.locator('span');
    await expect(span).toHaveClass(/red/);
    await expect(span).toHaveClass(/green/);
    await expect(span).toHaveClass(/blue/);
    await expect(span).toHaveText('dom api');

    // Modify innerHTML
    await elm.evaluate((el) => {
      el.innerHTML = '<div>changed content</div>';
    });

    await page.waitForChanges();

    await expect(elm.locator('div')).toHaveText('changed content');
  });

  test('should test textContent', async ({ page }) => {
    await page.setContent(`
      <dom-api></dom-api>
    `);

    const elm = page.locator('dom-api');

    await expect(elm).toHaveText('dom api');

    await elm.evaluate((el) => {
      el.textContent = 'updated text content';
    });

    await page.waitForChanges();

    await expect(elm).toHaveText('updated text content');

    const nodeInfo = await elm.evaluate((el) => ({
      nodeType: el.nodeType,
      nodeName: el.nodeName,
      tagName: el.tagName,
    }));

    expect(nodeInfo.nodeType).toBe(1);
    expect(nodeInfo.nodeName).toBe('DOM-API');
    expect(nodeInfo.tagName).toBe('DOM-API');
  });
});

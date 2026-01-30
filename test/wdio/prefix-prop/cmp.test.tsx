import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser,expect } from '@wdio/globals';

describe('prefix-prop', () => {
  before(async () => {
    render({
      components: [],
      template: () => <prefix-prop-root></prefix-prop-root>,
    });
  });

  it('should pass values from parent to nested component using prop: prefix', async () => {
    const nested = await $('prefix-prop-nested');
    await nested.waitForExist();

    const el = document.querySelector('prefix-prop-nested');
    expect(el.message).toBe('Hello');
    expect(el.count).toBe(42);
    expect(el.nullValue).toBe(null);
    expect(el.undefinedValue == null).toBe(true);

    // Verify NO HTML attributes are set
    await expect(nested).not.toHaveAttribute('message');
    await expect(nested).not.toHaveAttribute('count');
    await expect(nested).not.toHaveAttribute('nullValue');
    await expect(nested).not.toHaveAttribute('undefinedValue');
  });

  it('should update nested component when parent state changes', async () => {
    const nested = await $('prefix-prop-nested');
    const el = document.querySelector('prefix-prop-nested');

    const updateBtn = await $('button=Update Message');
    await updateBtn.click();
    await browser.pause(100);
    expect(el.message).toBe('Updated');

    const countBtn = await $('button=Update Count');
    await countBtn.click();
    await browser.pause(100);
    expect(el.count).toBe(99);

    // Still no attributes
    await expect(nested).not.toHaveAttribute('message');
    await expect(nested).not.toHaveAttribute('count');
  });

  it('should handle null and undefined values correctly', async () => {
    await $('prefix-prop-nested');
    const el = document.querySelector('prefix-prop-nested');
    expect(el.nullValue).toBe(null);
    // undefined becomes null in Stencil
    expect(el.undefinedValue == null).toBe(true);

    // When set to actual strings, they should update
    const setNullBtn = await $('button=Set Null to String');
    await setNullBtn.click();

    await browser.pause(100);
    expect(el.nullValue).toBe('not-null');

    const setUndefinedBtn = await $('button=Set Undefined to String');
    await setUndefinedBtn.click();

    await browser.pause(100);
    expect(el.undefinedValue).toBe('defined');
  });
});

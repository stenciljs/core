import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

// Verify attr: prefix in JSX correctly passes values as attributes to nested component

describe('prefix-attr', () => {
  before(async () => {
    render({
      components: [],
      template: () => <prefix-attr-root></prefix-attr-root>,
    });
  });

  it('should pass values from parent to nested component using attr: prefix', async () => {
    const nested = await $('prefix-attr-nested');
    await expect(nested).toHaveAttribute('message', 'Hello');
    await expect(nested).toHaveAttribute('count', '42');
    await expect(nested).toHaveAttribute('enabled');
    await expect(nested).toHaveAttribute('nullValue', 'not-null');
    await expect(nested).toHaveAttribute('undefinedValue', 'defined');
  });

  it('should update nested component when parent state changes', async () => {
    const nested = await $('prefix-attr-nested');
    const updateBtn = await $('button=Update Message');
    await updateBtn.click();
    await expect(nested).toHaveAttribute('message', 'Updated');

    const countBtn = await $('button=Update Count');
    await countBtn.click();
    await expect(nested).toHaveAttribute('count', '99');

    const disableBtn = await $('button=Disable');
    await disableBtn.click();
    await expect(nested).not.toHaveAttribute('enabled');

    const setNullBtn = await $('button=Set Null to String');
    await setNullBtn.click();
    await expect(nested).not.toHaveAttribute('nullValue');

    const setUndefinedBtn = await $('button=Set Undefined to String');
    await setUndefinedBtn.click();
    await expect(nested).not.toHaveAttribute('undefinedValue');
  });
});

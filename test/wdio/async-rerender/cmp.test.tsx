import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('asynchronous re-rendering', () => {
  before(async () => {
    render({
      template: () => <async-rerender></async-rerender>,
    });
  });

  it('button click re-renders', async () => {
    await $('async-rerender .number').waitForExist();
    const listItems1 = await $$('async-rerender .number');
    await expect(listItems1.length).toBe(10);

    const button = await $$('button');
    await button[0].click();
    await $('async-rerender .loaded').waitForExist();
    const listItems2 = await $$('async-rerender .number');
    await expect(listItems2.length).toBe(5);

    await button[1].click();
    await $('async-rerender .loaded').waitForExist();
    const listItems3 = await $$('async-rerender .number');
    await expect(listItems3.length).toBe(10);
  });
});

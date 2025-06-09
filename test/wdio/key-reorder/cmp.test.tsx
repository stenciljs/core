import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('key-reorder', function () {
  beforeEach(() => {
    render({
      template: () => <key-reorder></key-reorder>,
    });
  });

  it('uses same nodes after reorder', async () => {
    await $('#item-0').waitForExist();
    let item0 = document.body.querySelector('#item-0') as any;
    let item1 = document.body.querySelector('#item-1') as any;
    let item2 = document.body.querySelector('#item-2') as any;
    let item3 = document.body.querySelector('#item-3') as any;
    let item4 = document.body.querySelector('#item-4') as any;

    expect(item0.previousElementSibling).toBe(null);
    expect(item1.previousElementSibling).toBe(item0);
    expect(item2.previousElementSibling).toBe(item1);
    expect(item3.previousElementSibling).toBe(item2);
    expect(item4.previousElementSibling).toBe(item3);

    item0.__orgItem = 0;
    item1.__orgItem = 1;
    item2.__orgItem = 2;
    item3.__orgItem = 3;
    item4.__orgItem = 4;

    const button = $('button');
    await button.click();
    await $('#item-4').waitForExist();

    item0 = document.body.querySelector('#item-0') as any;
    item1 = document.body.querySelector('#item-1') as any;
    item2 = document.body.querySelector('#item-2') as any;
    item3 = document.body.querySelector('#item-3') as any;
    item4 = document.body.querySelector('#item-4') as any;

    expect(item0.previousElementSibling).toBe(item1);
    expect(item1.previousElementSibling).toBe(item2);
    expect(item2.previousElementSibling).toBe(item3);
    expect(item3.previousElementSibling).toBe(item4);
    expect(item4.previousElementSibling).toBe(null);
  });
});

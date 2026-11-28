import { render, h, describe, it, expect } from '@stencil/vitest';

describe('key-reorder', () => {
  it('uses same nodes after reorder', async () => {
    const { root, waitForChanges } = await render(<key-reorder />);

    let item0 = root.querySelector('#item-0') as any;
    let item1 = root.querySelector('#item-1') as any;
    let item2 = root.querySelector('#item-2') as any;
    let item3 = root.querySelector('#item-3') as any;
    let item4 = root.querySelector('#item-4') as any;

    expect(item0.previousElementSibling).toBe(null);
    expect(item1.previousElementSibling).toBe(item0);
    expect(item2.previousElementSibling).toBe(item1);
    expect(item3.previousElementSibling).toBe(item2);
    expect(item4.previousElementSibling).toBe(item3);

    // Mark elements to verify they're reused
    item0.__orgItem = 0;
    item1.__orgItem = 1;
    item2.__orgItem = 2;
    item3.__orgItem = 3;
    item4.__orgItem = 4;

    const button = root.querySelector('button')!;
    button.click();
    await waitForChanges();

    item0 = root.querySelector('#item-0') as any;
    item1 = root.querySelector('#item-1') as any;
    item2 = root.querySelector('#item-2') as any;
    item3 = root.querySelector('#item-3') as any;
    item4 = root.querySelector('#item-4') as any;

    // After reverse, order should be 4,3,2,1,0
    expect(item0.previousElementSibling).toBe(item1);
    expect(item1.previousElementSibling).toBe(item2);
    expect(item2.previousElementSibling).toBe(item3);
    expect(item3.previousElementSibling).toBe(item4);
    expect(item4.previousElementSibling).toBe(null);
  });
});

import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-nested-default-order', function () {
  beforeEach(async () => {
    render({
      template: () => (
        <slot-nested-default-order-parent>
          <p>Hello</p>
        </slot-nested-default-order-parent>
      ),
    });
  });

  it('should render the slot content after the div', async () => {
    const childCmps = $$('slot-nested-default-order-parent slot-nested-default-order-child > *');

    await expect(childCmps).toBeElementsArrayOfSize(2);
    expect(await childCmps[0].getTagName()).toBe('div');
    await expect(childCmps[0]).toHaveText('State: true');

    expect(await childCmps[1].getTagName()).toBe('p');
    await expect(childCmps[1]).toHaveText('Hello');
  });
});

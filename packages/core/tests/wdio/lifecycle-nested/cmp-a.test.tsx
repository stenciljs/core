import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('lifecycle-nested', () => {
  beforeEach(() => {
    render({
      // Component are nested in reverse alphabetical order
      template: () => (
        <>
          <lifecycle-nested-c>
            <lifecycle-nested-b>
              <lifecycle-nested-a></lifecycle-nested-a>
            </lifecycle-nested-b>
          </lifecycle-nested-c>
          <ol id="lifecycle-loads" class="lifecycle-loads"></ol>
        </>
      ),
    });
  });

  it('fire load methods in order for nested elements', async () => {
    // the `li` elements we want are in the `ol`!
    await $('ol').waitForStable();
    const loads = $('.lifecycle-loads').$$('li');
    await expect(loads).toBeElementsArrayOfSize(6);
    await expect(loads[0]).toHaveText('componentWillLoad-c');
    await expect(loads[1]).toHaveText('componentWillLoad-b');
    await expect(loads[2]).toHaveText('componentWillLoad-a');
    await expect(loads[3]).toHaveText('componentDidLoad-a');
    await expect(loads[4]).toHaveText('componentDidLoad-b');
    await expect(loads[5]).toHaveText('componentDidLoad-c');
  });
});

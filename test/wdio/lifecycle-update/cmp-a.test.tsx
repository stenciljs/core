import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('lifecycle-update', function () {
  beforeEach(() => {
    render({
      template: () => (
        <>
          <ol id="output"></ol>
          <hr />
          <lifecycle-update-a></lifecycle-update-a>
        </>
      ),
    });
  });

  it('fire load methods in order', async () => {
    await $('#output').waitForStable();
    let loads = await $('#output').$$('li');
    await expect(loads).toBeElementsArrayOfSize(2);

    await expect(loads[0]).toHaveText('lifecycle-update-a componentWillLoad');
    await expect(loads[1]).toHaveText('lifecycle-update-a componentDidLoad');

    const button = await $('button');
    await button.click();
    await $('#output').waitForStable();

    loads = await $('#output').$$('li');
    await expect(loads).toBeElementsArrayOfSize(9);
    loads = await $('#output').$$('li');

    await expect(loads[0]).toHaveText('lifecycle-update-a componentWillLoad');
    await expect(loads[1]).toHaveText('lifecycle-update-a componentDidLoad');
    await expect(loads[2]).toHaveText('async add child components to lifecycle-update-a 1');
    await expect(loads[3]).toHaveText('lifecycle-update-a componentWillUpdate 1');
    await expect(loads[4]).toHaveText('lifecycle-update-b componentWillLoad 1');
    await expect(loads[5]).toHaveText('lifecycle-update-c componentWillLoad 1');
    await expect(loads[6]).toHaveText('lifecycle-update-c componentDidLoad 1');
    await expect(loads[7]).toHaveText('lifecycle-update-b componentDidLoad 1');
    await expect(loads[8]).toHaveText('lifecycle-update-a componentDidUpdate 1');

    await button.click();
    await $('#output').waitForStable();

    loads = await $('#output').$$('li');
    await expect(loads).toBeElementsArrayOfSize(16);
    loads = await $('#output').$$('li');

    await expect(loads[0]).toHaveText('lifecycle-update-a componentWillLoad');
    await expect(loads[1]).toHaveText('lifecycle-update-a componentDidLoad');
    await expect(loads[2]).toHaveText('async add child components to lifecycle-update-a 1');
    await expect(loads[3]).toHaveText('lifecycle-update-a componentWillUpdate 1');
    await expect(loads[4]).toHaveText('lifecycle-update-b componentWillLoad 1');
    await expect(loads[5]).toHaveText('lifecycle-update-c componentWillLoad 1');
    await expect(loads[6]).toHaveText('lifecycle-update-c componentDidLoad 1');
    await expect(loads[7]).toHaveText('lifecycle-update-b componentDidLoad 1');
    await expect(loads[8]).toHaveText('lifecycle-update-a componentDidUpdate 1');
    await expect(loads[9]).toHaveText('async add child components to lifecycle-update-a 2');
    await expect(loads[10]).toHaveText('lifecycle-update-a componentWillUpdate 2');
    await expect(loads[11]).toHaveText('lifecycle-update-b componentWillLoad 2');
    await expect(loads[12]).toHaveText('lifecycle-update-c componentWillLoad 2');
    await expect(loads[13]).toHaveText('lifecycle-update-c componentDidLoad 2');
    await expect(loads[14]).toHaveText('lifecycle-update-b componentDidLoad 2');
    await expect(loads[15]).toHaveText('lifecycle-update-a componentDidUpdate 2');
  });
});

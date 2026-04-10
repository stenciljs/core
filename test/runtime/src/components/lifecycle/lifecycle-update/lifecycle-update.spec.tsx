import { Fragment } from '@stencil/core';
import { render, h, describe, it, expect, waitForStable, waitForExist } from '@stencil/vitest';

describe('lifecycle-update', () => {
  it('fire load methods in order', async () => {
    const { waitForChanges } = await render(
      <>
        <ol id='output'></ol>
        <hr />
        <lifecycle-update-a></lifecycle-update-a>
      </>,
      { waitForReady: false },
    );

    await waitForExist('lifecycle-update-a.hydrated');
    let loads = document.querySelectorAll('#output li');
    expect(loads).toHaveLength(2);

    expect(loads[0]).toHaveTextContent('lifecycle-update-a componentWillLoad');
    expect(loads[1]).toHaveTextContent('lifecycle-update-a componentDidLoad');

    const button = document.querySelector('button')!;
    button.click();
    await waitForChanges();
    await waitForStable('#output');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    loads = document.querySelectorAll('#output li');
    expect(loads).toHaveLength(9);

    expect(loads[0]).toHaveTextContent('lifecycle-update-a componentWillLoad');
    expect(loads[1]).toHaveTextContent('lifecycle-update-a componentDidLoad');
    expect(loads[2]).toHaveTextContent('async add child components to lifecycle-update-a 1');
    expect(loads[3]).toHaveTextContent('lifecycle-update-a componentWillUpdate 1');
    expect(loads[4]).toHaveTextContent('lifecycle-update-b componentWillLoad 1');
    expect(loads[5]).toHaveTextContent('lifecycle-update-c componentWillLoad 1');
    expect(loads[6]).toHaveTextContent('lifecycle-update-c componentDidLoad 1');
    expect(loads[7]).toHaveTextContent('lifecycle-update-b componentDidLoad 1');
    expect(loads[8]).toHaveTextContent('lifecycle-update-a componentDidUpdate 1');

    button.click();
    await waitForChanges();
    await waitForStable('#output');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    loads = document.querySelectorAll('#output li');
    expect(loads).toHaveLength(16);

    expect(loads[0]).toHaveTextContent('lifecycle-update-a componentWillLoad');
    expect(loads[1]).toHaveTextContent('lifecycle-update-a componentDidLoad');
    expect(loads[2]).toHaveTextContent('async add child components to lifecycle-update-a 1');
    expect(loads[3]).toHaveTextContent('lifecycle-update-a componentWillUpdate 1');
    expect(loads[4]).toHaveTextContent('lifecycle-update-b componentWillLoad 1');
    expect(loads[5]).toHaveTextContent('lifecycle-update-c componentWillLoad 1');
    expect(loads[6]).toHaveTextContent('lifecycle-update-c componentDidLoad 1');
    expect(loads[7]).toHaveTextContent('lifecycle-update-b componentDidLoad 1');
    expect(loads[8]).toHaveTextContent('lifecycle-update-a componentDidUpdate 1');
    expect(loads[9]).toHaveTextContent('async add child components to lifecycle-update-a 2');
    expect(loads[10]).toHaveTextContent('lifecycle-update-a componentWillUpdate 2');
    expect(loads[11]).toHaveTextContent('lifecycle-update-b componentWillLoad 2');
    expect(loads[12]).toHaveTextContent('lifecycle-update-c componentWillLoad 2');
    expect(loads[13]).toHaveTextContent('lifecycle-update-c componentDidLoad 2');
    expect(loads[14]).toHaveTextContent('lifecycle-update-b componentDidLoad 2');
    expect(loads[15]).toHaveTextContent('lifecycle-update-a componentDidUpdate 2');
  });
});

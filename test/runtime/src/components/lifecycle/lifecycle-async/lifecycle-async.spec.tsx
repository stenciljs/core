import { render, h, describe, it, expect, waitForStable } from '@stencil/vitest';

import { timeout } from './util';

describe('lifecycle-async', () => {
  it('fire load methods in order', async () => {
    const { root, waitForChanges } = await render(<lifecycle-async-a />);

    await timeout(500);
    await waitForChanges();

    let loads = root.querySelectorAll('.lifecycle-loads-a li');
    expect(loads.length).toBe(6);
    expect(loads[0]).toHaveTextContent('componentWillLoad-a');
    expect(loads[1]).toHaveTextContent('componentWillLoad-b');
    expect(loads[2]).toHaveTextContent('componentWillLoad-c');
    expect(loads[3]).toHaveTextContent('componentDidLoad-c');
    expect(loads[4]).toHaveTextContent('componentDidLoad-b');
    expect(loads[5]).toHaveTextContent('componentDidLoad-a');

    expect(root.querySelector('.lifecycle-updates-a li')).toBeFalsy();

    const button = root.querySelector('button')!;
    button.click();
    await waitForChanges();
    await waitForStable('lifecycle-async-a');

    await timeout(500);
    await waitForChanges();

    loads = root.querySelectorAll('.lifecycle-loads-a li');
    expect(loads.length).toBe(6);

    expect(loads[0]).toHaveTextContent('componentWillLoad-a');
    expect(loads[1]).toHaveTextContent('componentWillLoad-b');
    expect(loads[2]).toHaveTextContent('componentWillLoad-c');
    expect(loads[3]).toHaveTextContent('componentDidLoad-c');
    expect(loads[4]).toHaveTextContent('componentDidLoad-b');
    expect(loads[5]).toHaveTextContent('componentDidLoad-a');

    const updates = root.querySelectorAll('.lifecycle-updates-a li');
    expect(updates.length).toBe(6);

    expect(updates[0]).toHaveTextContent('componentWillUpdate-a');
    expect(updates[1]).toHaveTextContent('componentWillUpdate-b');
    expect(updates[2]).toHaveTextContent('componentWillUpdate-c');
    expect(updates[3]).toHaveTextContent('componentDidUpdate-c');
    expect(updates[4]).toHaveTextContent('componentDidUpdate-b');
    expect(updates[5]).toHaveTextContent('componentDidUpdate-a');
  });
});

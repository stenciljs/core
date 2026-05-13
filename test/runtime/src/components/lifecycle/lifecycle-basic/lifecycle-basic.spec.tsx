import { render, h, describe, it, expect } from '@stencil/vitest';

describe('lifecycle-basic', () => {
  it('fire load methods in order', async () => {
    const { root, waitForChanges } = await render(<lifecycle-basic-a />);

    let loads = root.querySelectorAll('.lifecycle-loads-a li');
    expect(loads.length).toBe(6);
    expect(loads[0]).toHaveTextContent('componentWillLoad-a');
    expect(loads[1]).toHaveTextContent('componentWillLoad-b');
    expect(loads[2]).toHaveTextContent('componentWillLoad-c');
    expect(loads[3]).toHaveTextContent('componentDidLoad-c');
    expect(loads[4]).toHaveTextContent('componentDidLoad-b');
    expect(loads[5]).toHaveTextContent('componentDidLoad-a');

    let updates = root.querySelectorAll('.lifecycle-updates-a li');
    expect(updates.length).toBe(0);

    const button = root.querySelector('button')!;
    button.click();
    await waitForChanges();

    loads = root.querySelectorAll('.lifecycle-loads-a li');
    expect(loads.length).toBe(6);
    expect(loads[0]).toHaveTextContent('componentWillLoad-a');
    expect(loads[1]).toHaveTextContent('componentWillLoad-b');
    expect(loads[2]).toHaveTextContent('componentWillLoad-c');
    expect(loads[3]).toHaveTextContent('componentDidLoad-c');
    expect(loads[4]).toHaveTextContent('componentDidLoad-b');
    expect(loads[5]).toHaveTextContent('componentDidLoad-a');

    updates = root.querySelectorAll('.lifecycle-updates-a li');
    expect(updates.length).toBe(6);
    expect(updates[0]).toHaveTextContent('componentWillUpdate-a');
    expect(updates[1]).toHaveTextContent('componentWillUpdate-b');
    expect(updates[2]).toHaveTextContent('componentWillUpdate-c');
    expect(updates[3]).toHaveTextContent('componentDidUpdate-c');
    expect(updates[4]).toHaveTextContent('componentDidUpdate-b');
    expect(updates[5]).toHaveTextContent('componentDidUpdate-a');
  });
});

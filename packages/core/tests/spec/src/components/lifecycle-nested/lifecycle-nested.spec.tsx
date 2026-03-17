import { render, h, describe, it, expect, waitForStable } from '@stencil/vitest';
import { Fragment } from '@stencil/core';

describe('lifecycle-nested', () => {
  it('fire load methods in order for nested elements', async () => {
    const { waitForChanges } = await render(
      <>
        <lifecycle-nested-c>
          <lifecycle-nested-b>
            <lifecycle-nested-a></lifecycle-nested-a>
          </lifecycle-nested-b>
        </lifecycle-nested-c>
        <ol id="lifecycle-loads" class="lifecycle-loads"></ol>
      </>,
    );

    await waitForChanges();
    await waitForStable('ol'); 

    const loads = document.querySelectorAll('.lifecycle-loads li');
    expect(loads).toHaveLength(6);
    expect(loads[0]).toHaveTextContent('componentWillLoad-c');
    expect(loads[1]).toHaveTextContent('componentWillLoad-b');
    expect(loads[2]).toHaveTextContent('componentWillLoad-a');
    expect(loads[3]).toHaveTextContent('componentDidLoad-a');
    expect(loads[4]).toHaveTextContent('componentDidLoad-b');
    expect(loads[5]).toHaveTextContent('componentDidLoad-c');
  });
});

import { Fragment } from '@stencil/core';
import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('shared-jsx', () => {
  it('should not share JSX nodes', async () => {
    await render(
      <>
        <bad-shared-jsx />
        <factory-jsx />
      </>,
    );
    await waitForExist('bad-shared-jsx.hydrated');
    await waitForExist('factory-jsx.hydrated');

    // Check bad-shared-jsx renders both divs
    const badSharedJsx = document.querySelector('bad-shared-jsx');
    const badDivs = badSharedJsx!.querySelectorAll('div > div');
    expect(badDivs).toHaveLength(2);
    expect(badDivs[0]).toHaveTextContent('Do Not Share JSX Nodes!');
    expect(badDivs[1]).toHaveTextContent('Do Not Share JSX Nodes!');

    // Check factory-jsx renders both divs
    const factoryJsx = document.querySelector('factory-jsx');
    const factoryDivs = factoryJsx!.querySelectorAll('div > div');
    expect(factoryDivs).toHaveLength(2);
    expect(factoryDivs[0]).toHaveTextContent('Factory JSX');
    expect(factoryDivs[1]).toHaveTextContent('Factory JSX');
  });
});

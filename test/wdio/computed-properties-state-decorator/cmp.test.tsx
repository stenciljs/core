import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('computed-properties-state-decorator', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <computed-properties-state-decorator></computed-properties-state-decorator>
          <button type="button">Change state values</button>
        </>
      ),
    });
    document.querySelector('button').addEventListener('click', () => {
      const cmp = document.querySelector('computed-properties-state-decorator');
      cmp.changeStates();
    });
  });

  it('correctly sets computed property `@State()`s and triggers re-renders', async () => {
    const el: HTMLElement = document.querySelector('computed-properties-state-decorator');
    await expect($(el)).toHaveText(['Has rendered: false', 'Mode: default'].join('\n'));

    const button = document.querySelector('button');
    expect(button).toBeDefined();

    await $(button).click();

    await expect($(el)).toHaveText(['Has rendered: true', 'Mode: super'].join('\n'));
  });
});

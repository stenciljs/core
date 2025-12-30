import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('svg class', () => {
  beforeEach(() => {
    render({
      template: () => (
        <>
          <style>
            {`.primary circle {
                fill: red;
              }
              .primary rect {
                fill: blue;
              }`}
          </style>
          <svg-class></svg-class>
        </>
      ),
    });
  });

  it('toggles svg class', async () => {
    await $('svg-class').waitForExist();
    const svg = $('svg');
    const circle = $('circle');
    const rect = $('rect');

    await expect(svg).not.toHaveElementClass('primary');
    await expect(circle).not.toHaveElementClass('red');
    await expect(rect).not.toHaveElementClass('blue');

    await $('button').click();
    await $('svg-class').waitForStable();

    await expect(svg).toHaveElementClass('primary');
    await expect(circle).toHaveElementClass('red');
    await expect(rect).toHaveElementClass('blue');
  });
});

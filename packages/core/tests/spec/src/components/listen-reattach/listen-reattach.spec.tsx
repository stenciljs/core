import { Fragment, render, h, describe, it, expect } from '@stencil/vitest';

describe('listen-reattach', () => {
  it('should receive click events, remove/attach, and receive more events', async () => {
    const { waitForChanges } = await render(
      <>
        <div class="box">
          <listen-reattach></listen-reattach>
          <div class="other">Some other content</div>
        </div>
        <button id="moveIt">Move it!!</button>
      </>,
    );

    const box = document.querySelector('.box')!;
    const moveable = document.querySelector('listen-reattach')!;
    const button = document.querySelector('#moveIt')!;
    button.addEventListener('click', function () {
      box.appendChild(moveable);
    });

    expect(document.querySelector('#clicked')).toHaveTextContent('Clicked: 0');

    for (let clicks = 1; clicks <= 2; clicks++) {
      document.querySelector('listen-reattach')!.click();
      await waitForChanges();
      expect(document.querySelector('#clicked')).toHaveTextContent('Clicked: ' + clicks);
    }

    (document.querySelector('#moveIt') as HTMLButtonElement).click();
    await waitForChanges();

    for (let clicks = 3; clicks <= 4; clicks++) {
      document.querySelector('listen-reattach')!.click();
      await waitForChanges();
      expect(document.querySelector('#clicked')).toHaveTextContent('Clicked: ' + clicks);
    }
  });
});

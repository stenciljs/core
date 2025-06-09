import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('listen-reattach', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <div class="box">
            <listen-reattach></listen-reattach>
            <div class="other">Some other content</div>
          </div>
          <button id="moveIt">Move it!!</button>
        </>
      ),
    });
    const box = document.querySelector('.box');
    const moveable = document.querySelector('listen-reattach');
    const button = document.querySelector('#moveIt');
    button.addEventListener('click', function () {
      box.appendChild(moveable);
    });
  });

  it('should receive click events, remove/attach, and receive more events', async () => {
    await expect($('#clicked')).toHaveText('Clicked: 0');

    for (let clicks = 1; clicks <= 2; clicks++) {
      await $('listen-reattach').click();
      await expect($('#clicked')).toHaveText('Clicked: ' + clicks);
    }

    await $('#moveIt').click();

    for (let clicks = 3; clicks <= 4; clicks++) {
      await $('listen-reattach').click();
      await expect($('#clicked')).toHaveText('Clicked: ' + clicks);
    }
  });
});

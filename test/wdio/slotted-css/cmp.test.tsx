import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slotted css', function () {
  beforeEach(async () => {
    render({
      template: () => (
        <slotted-css>
          <div class="red" slot="header-slot-name">
            header-slot-name: red color and border
          </div>
          <div class="green">default slot: green background, blue border and color</div>
          <div class="blue" slot="footer-slot-name">
            footer-slot-name: blue color and border
          </div>
        </slotted-css>
      ),
    });

    await $('slotted-css').waitForExist();
  });

  it('assign slotted css', async () => {
    const redElm = $('slotted-css .red');
    await expect(redElm).toHaveStyle({ color: 'rgb(255,0,0)' });

    // green background, blue border and color
    const greenElm = $('slotted-css .green');
    await expect(greenElm).toHaveStyle({
      background: `none 0% 0% auto repeat padding-box border-box scroll rgb(0, 255, 0)`,
      color: 'rgb(0,0,255)',
    });

    const blueElm = $('slotted-css .blue');
    await expect(blueElm).toHaveStyle({ color: 'rgb(0,0,255)' });
  });
});

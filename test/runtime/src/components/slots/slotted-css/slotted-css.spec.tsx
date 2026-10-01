import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slotted-css', () => {
  it('assign slotted css', async () => {
    const { root } = await render(
      <slotted-css>
        <div class='red' slot='header-slot-name'>
          header-slot-name: red color and border
        </div>
        <div class='green'>default slot: green background, blue border and color</div>
        <div class='blue' slot='footer-slot-name'>
          footer-slot-name: blue color and border
        </div>
      </slotted-css>,
    );
    await waitForExist('slotted-css.hydrated');

    const slottedCss = root;
    const redElm = slottedCss.querySelector('.red') as HTMLElement;
    const greenElm = slottedCss.querySelector('.green') as HTMLElement;
    const blueElm = slottedCss.querySelector('.blue') as HTMLElement;

    // Check computed styles
    const redStyle = window.getComputedStyle(redElm);
    expect(redStyle.color).toBe('rgb(255, 0, 0)');

    const greenStyle = window.getComputedStyle(greenElm);
    expect(greenStyle.backgroundColor).toBe('rgb(0, 255, 0)');
    expect(greenStyle.color).toBe('rgb(0, 0, 255)');

    const blueStyle = window.getComputedStyle(blueElm);
    expect(blueStyle.color).toBe('rgb(0, 0, 255)');
  });
});

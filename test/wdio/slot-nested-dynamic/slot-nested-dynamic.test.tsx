import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

const ITEM_CLASSNAME = 'default-slot-item';

describe('slot-nested-dynamic', function () {
  const getRandomizeButton = () => $('#randomizeButton');
  const getItems = () => $$(`.${ITEM_CLASSNAME}`);

  beforeEach(() => {
    render({
      flushQueue: true,
      template: () => {
        function randomize() {
          const parent = document.querySelector('slot-nested-dynamic-parent');

          for (const item of Array.from(parent?.querySelectorAll('.default-slot-item') || [])) {
            item.remove();
          }

          const min = 3;
          const max = 20;
          const count = Math.floor(Math.random() * (max - min + 1)) + min;
          const items = Array.from(new Array(count)).map((_, i) => {
            const element = document.createElement('span');
            element.className = 'default-slot-item';
            element.textContent = 'item-' + i;
            return element;
          });

          for (const item of items) {
            parent?.appendChild(item);
          }
        }
        return (
          <>
            <slot-nested-dynamic-parent></slot-nested-dynamic-parent>

            <button id="randomizeButton" onClick={() => randomize()}>
              Randomize Item Count
            </button>
          </>
        );
      },
    });
  });

  it('correct order after dynamic list generation', async () => {
    const button = getRandomizeButton();

    /* RUN DYNAMIC GENERATION */
    await button.click();
    const items = getItems();
    await expect(await items[0].getText()).toBe('item-0');
    await expect(await items[1].getText()).toBe('item-1');
    await expect(await items[2].getText()).toBe('item-2');

    /* RE-RUN DYNAMIC GENERATION */
    await button.click();
    const itemsRoundTwo = getItems();
    await expect(await itemsRoundTwo[0].getText()).toBe('item-0');
    await expect(await itemsRoundTwo[1].getText()).toBe('item-1');
    await expect(await itemsRoundTwo[2].getText()).toBe('item-2');
  });
});

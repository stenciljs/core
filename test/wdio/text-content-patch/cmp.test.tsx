import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('textContent patch', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <text-content-patch-scoped></text-content-patch-scoped>
          <text-content-patch-scoped-with-slot>
            {/*This should be ignored*/}
            Slot content
            <p slot="suffix">Suffix content</p>
          </text-content-patch-scoped-with-slot>
        </>
      ),
    });

    await $('text-content-patch-scoped').waitForExist();
  });

  describe('scoped encapsulation', () => {
    it('should return the content of all slots', async () => {
      const elm = $('text-content-patch-scoped-with-slot');
      await expect(elm.getText()).toMatchInlineSnapshot(`
        "Slot content
Suffix content"`);
    });

    it('should return an empty string if there is no slotted content', async () => {
      const elm = $('text-content-patch-scoped');
      await expect(await elm.getText()).toBe(``);
    });

    it('should overwrite the default slot content', async () => {
      const elm = await $('text-content-patch-scoped-with-slot');
      await browser.execute(
        (elm) => {
          elm.textContent = 'New slot content';
        },
        elm as any as HTMLElement,
      );

      await expect(elm.getText()).toMatchInlineSnapshot(`"New slot content"`);
    });

    it('should not insert the text node if there is no default slot', async () => {
      const elm = await $('text-content-patch-scoped');
      await browser.execute(
        (elm) => {
          elm.textContent = 'New slot content';
        },
        elm as any as HTMLElement,
      );

      await expect(await elm.getText()).toBe(``);
    });
  });
});

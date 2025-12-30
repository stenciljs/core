import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, browser, expect } from '@wdio/globals';

describe('textContent patch', () => {
  beforeEach(async () => {
    render({
      components: [],
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
      await expect(await elm.getText()).toBe('Slot content\nSuffix content');
    });

    it('should have default behaviour when there is no default slot', async () => {
      const elm = $('text-content-patch-scoped');
      await expect(await elm.getText()).toBe(`Top content
Bottom content`);
    });

    it('should overwrite the default slot content', async () => {
      const elm = await $('text-content-patch-scoped-with-slot');
      await browser.execute(
        (elm) => {
          elm.textContent = 'New slot content';
        },
        elm as any as HTMLElement,
      );

      await expect(await elm.getText()).toBe('New slot content');
    });

    it('should insert text node if there is no default slot', async () => {
      const elm = await $('text-content-patch-scoped');
      await browser.execute(
        (elm) => {
          elm.textContent = 'New slot content';
        },
        elm as any as HTMLElement,
      );

      await expect(await elm.getText()).toBe(`New slot content`);
    });
  });
});

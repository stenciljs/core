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
          <text-content-patch-scoped-named-slot></text-content-patch-scoped-named-slot>
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

  describe('text setters', () => {
    const markup = '<img src="x" onerror="window.__textContentXss = true"><b>bold</b>';

    afterEach(() => {
      delete (window as any).__textContentXss;
    });

    it('should insert `textContent` markup as a text node in the default slot', async () => {
      await $('text-content-patch-scoped-with-slot').waitForExist();
      const host = document.querySelector('text-content-patch-scoped-with-slot');
      host.textContent = markup;
      // give a parsed <img> time to fire its error handler
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(host.querySelector('img')).toBeNull();
      expect(host.querySelector('b')).toBeNull();
      expect((window as any).__textContentXss).toBeUndefined();
      expect(host.textContent).toBe(markup);
      expect(host.childNodes.length).toBe(1);
      expect(host.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      // the text is relocated into the default slot, between the two rendered paragraphs
      const realChildNodes = Array.from((host as any).__childNodes as NodeListOf<ChildNode>);
      const textIndex = realChildNodes.findIndex((n) => n.nodeType === Node.TEXT_NODE && n.nodeValue === markup);
      const topIndex = realChildNodes.findIndex((n) => n.textContent === 'Top content');
      const bottomIndex = realChildNodes.findIndex((n) => n.textContent === 'Bottom content');
      expect(topIndex).toBeLessThan(textIndex);
      expect(textIndex).toBeLessThan(bottomIndex);
      await expect(await $('text-content-patch-scoped-with-slot').getText()).toContain(markup);
    });

    it('should clear slotted content when `textContent` is set to an empty string or null', async () => {
      await $('text-content-patch-scoped-with-slot').waitForExist();
      const host = document.querySelector('text-content-patch-scoped-with-slot');

      host.textContent = '';
      expect(host.childNodes.length).toBe(0);
      expect(host.textContent).toBe('');

      host.textContent = 'something';
      host.textContent = null;
      expect(host.childNodes.length).toBe(0);
    });

    // with no default slot the nodes stay in the host's light DOM, so these check the real child nodes
    const realTextNodes = (host: Element) =>
      Array.from((host as any).__childNodes as NodeListOf<ChildNode>)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.nodeValue);

    it('should insert markup as text on a host with only a named slot', async () => {
      await $('text-content-patch-scoped-named-slot').waitForExist();
      const host = document.querySelector('text-content-patch-scoped-named-slot');

      host.textContent = markup;
      host.insertAdjacentText('afterbegin', `${markup} (afterbegin)`);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(host.querySelector('img')).toBeNull();
      expect(host.querySelector('b')).toBeNull();
      expect((window as any).__textContentXss).toBeUndefined();
      expect(realTextNodes(host)).toContain(markup);
      expect(realTextNodes(host)).toContain(`${markup} (afterbegin)`);
    });

    it('should prepend to a host with only a named slot', async () => {
      await $('text-content-patch-scoped-named-slot').waitForExist();
      const host = document.querySelector('text-content-patch-scoped-named-slot');

      // no default slot, so `prepend` takes the native fallback path
      host.prepend('prepended');

      expect(realTextNodes(host)).toContain('prepended');
    });
  });
});

import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-reorder', () => {
  const style = `.reordered {
  background: yellow;
}`;

  beforeEach(async () => {
    render({
      template: () => (
        <>
          <style>{style}</style>
          <slot-reorder-root></slot-reorder-root>
        </>
      ),
    });

    await $('slot-reorder-root').waitForExist();
  });

  it('renders', async () => {
    function ordered() {
      let r = document.querySelector('.results1 div');
      expect(r.children[0].textContent.trim()).toBe('fallback default');
      expect(r.children[0].hasAttribute('hidden')).toBe(false);
      expect(r.children[0].getAttribute('name')).toBe(null);
      expect(r.children[1].textContent.trim()).toBe('fallback slot-a');
      expect(r.children[1].hasAttribute('hidden')).toBe(false);
      expect(r.children[1].getAttribute('name')).toBe('slot-a');
      expect(r.children[2].textContent.trim()).toBe('fallback slot-b');
      expect(r.children[2].hasAttribute('hidden')).toBe(false);
      expect(r.children[2].getAttribute('name')).toBe('slot-b');

      r = document.querySelector('.results2 div');
      expect(r.children[0].textContent.trim()).toBe('fallback default');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe(null);
      expect(r.children[1].textContent.trim()).toBe('default content');
      expect(r.children[2].textContent.trim()).toBe('fallback slot-a');
      expect(r.children[2].hasAttribute('hidden')).toBe(false);
      expect(r.children[2].getAttribute('name')).toBe('slot-a');
      expect(r.children[3].textContent.trim()).toBe('fallback slot-b');
      expect(r.children[3].hasAttribute('hidden')).toBe(false);
      expect(r.children[3].getAttribute('name')).toBe('slot-b');

      r = document.querySelector('.results3 div');
      expect(r.children[0].textContent.trim()).toBe('fallback default');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe(null);
      expect(r.children[1].textContent.trim()).toBe('default content');
      expect(r.children[2].textContent.trim()).toBe('fallback slot-a');
      expect(r.children[2].hasAttribute('hidden')).toBe(true);
      expect(r.children[2].getAttribute('name')).toBe('slot-a');
      expect(r.children[3].textContent.trim()).toBe('slot-a content');
      expect(r.children[4].textContent.trim()).toBe('fallback slot-b');
      expect(r.children[4].hasAttribute('hidden')).toBe(true);
      expect(r.children[4].getAttribute('name')).toBe('slot-b');
      expect(r.children[5].textContent.trim()).toBe('slot-b content');

      r = document.querySelector('.results4 div');
      expect(r.children[0].textContent.trim()).toBe('fallback default');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe(null);
      expect(r.children[1].textContent.trim()).toBe('default content');
      expect(r.children[2].textContent.trim()).toBe('fallback slot-a');
      expect(r.children[2].hasAttribute('hidden')).toBe(true);
      expect(r.children[2].getAttribute('name')).toBe('slot-a');
      expect(r.children[3].textContent.trim()).toBe('slot-a content');
      expect(r.children[4].textContent.trim()).toBe('fallback slot-b');
      expect(r.children[4].hasAttribute('hidden')).toBe(true);
      expect(r.children[4].getAttribute('name')).toBe('slot-b');
      expect(r.children[5].textContent.trim()).toBe('slot-b content');
    }

    function reordered() {
      let r = document.querySelector('.results1 div');
      expect(r.children[0].textContent.trim()).toBe('fallback slot-b');
      expect(r.children[0].hasAttribute('hidden')).toBe(false);
      expect(r.children[0].getAttribute('name')).toBe('slot-b');
      expect(r.children[1].textContent.trim()).toBe('fallback default');
      expect(r.children[1].hasAttribute('hidden')).toBe(false);
      expect(r.children[1].getAttribute('name')).toBe(null);
      expect(r.children[2].textContent.trim()).toBe('fallback slot-a');
      expect(r.children[2].hasAttribute('hidden')).toBe(false);
      expect(r.children[2].getAttribute('name')).toBe('slot-a');

      r = document.querySelector('.results2 div');
      expect(r.children[0].textContent.trim()).toBe('fallback slot-b');
      expect(r.children[0].hasAttribute('hidden')).toBe(false);
      expect(r.children[0].getAttribute('name')).toBe('slot-b');
      expect(r.children[1].textContent.trim()).toBe('fallback default');
      expect(r.children[1].hasAttribute('hidden')).toBe(true);
      expect(r.children[1].getAttribute('name')).toBe(null);
      expect(r.children[2].textContent.trim()).toBe('default content');
      expect(r.children[3].textContent.trim()).toBe('fallback slot-a');
      expect(r.children[3].hasAttribute('hidden')).toBe(false);
      expect(r.children[3].getAttribute('name')).toBe('slot-a');

      r = document.querySelector('.results3 div');
      expect(r.children[0].textContent.trim()).toBe('fallback slot-b');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe('slot-b');
      expect(r.children[1].textContent.trim()).toBe('slot-b content');
      expect(r.children[2].textContent.trim()).toBe('fallback default');
      expect(r.children[2].hasAttribute('hidden')).toBe(true);
      expect(r.children[2].getAttribute('name')).toBe(null);
      expect(r.children[3].textContent.trim()).toBe('default content');
      expect(r.children[4].textContent.trim()).toBe('fallback slot-a');
      expect(r.children[4].hasAttribute('hidden')).toBe(true);
      expect(r.children[4].getAttribute('name')).toBe('slot-a');
      expect(r.children[5].textContent.trim()).toBe('slot-a content');

      r = document.querySelector('.results4 div');
      expect(r.children[0].textContent.trim()).toBe('fallback slot-b');
      expect(r.children[0].hasAttribute('hidden')).toBe(true);
      expect(r.children[0].getAttribute('name')).toBe('slot-b');
      expect(r.children[1].textContent.trim()).toBe('slot-b content');
      expect(r.children[2].textContent.trim()).toBe('fallback default');
      expect(r.children[2].hasAttribute('hidden')).toBe(true);
      expect(r.children[2].getAttribute('name')).toBe(null);
      expect(r.children[3].textContent.trim()).toBe('default content');
      expect(r.children[4].textContent.trim()).toBe('fallback slot-a');
      expect(r.children[4].hasAttribute('hidden')).toBe(true);
      expect(r.children[4].getAttribute('name')).toBe('slot-a');
      expect(r.children[5].textContent.trim()).toBe('slot-a content');
    }

    await $('.results1 div').waitForExist();
    ordered();

    await $('button').click();
    await browser.waitUntil(async () => {
      return document.querySelector('div.reordered');
    });

    await $('.results1 div').waitForExist();
    reordered();

    await $('button').click();
    await browser.waitUntil(async () => {
      return !document.querySelector('div.reordered');
    });

    await $('.results1 div').waitForExist();
    ordered();

    await $('button').click();
    await browser.waitUntil(async () => {
      return document.querySelector('div.reordered');
    });

    await $('.results1 div').waitForExist();
    reordered();
  });
});

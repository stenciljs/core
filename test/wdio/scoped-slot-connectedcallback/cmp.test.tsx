import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

import { setupIFrameTest } from '../util.js';
import { $, expect, browser } from '@wdio/globals';

describe('scoped-slot-connectedcallback', function () {
  describe('lazy load (dist output)', () => {
    beforeEach(() => {
      render({
        components: [],
        template: () => <scoped-slot-connectedcallback-parent />,
      });
    });

    it('should have slotted content available in connectedCallback', async () => {
      await $('scoped-slot-connectedcallback-child').waitForExist();

      const child = await $('scoped-slot-connectedcallback-child');
      const connectedAttr = await child.getAttribute('data-connected-slot-available');
      const willLoadAttr = await child.getAttribute('data-willload-slot-available');

      // Both connectedCallback and componentWillLoad should have access to slotted content
      expect(connectedAttr).toBe('true');
      expect(willLoadAttr).toBe('true');
    });

    it('should render slotted content correctly', async () => {
      await $('scoped-slot-connectedcallback-child').waitForExist();

      const slottedContent = await $('#slotted-content');
      await expect(slottedContent).toBeExisting();
      await expect(slottedContent).toHaveText('Slotted Content');

      const wrapper = await $('.wrapper');
      const text = await wrapper.getText();
      expect(text).toContain('Before slot');
      expect(text).toContain('Slotted Content');
      expect(text).toContain('After slot');
    });
  });

  describe('dist-custom-elements output', () => {
    let doc: Document;

    beforeEach(async () => {
      await setupIFrameTest('/scoped-slot-connectedcallback/custom-element.html', 'custom-elements-iframe');
      const frameEle: HTMLIFrameElement = document.querySelector('iframe#custom-elements-iframe');
      doc = frameEle.contentDocument;

      // Render the component inside the iframe
      const parent = doc.createElement('scoped-slot-connectedcallback-parent');
      doc.body.appendChild(parent);

      // Wait for component to be ready
      await browser.waitUntil(() => Boolean(doc.querySelector('scoped-slot-connectedcallback-child')));
    });

    it('should have slotted content available in connectedCallback', async () => {
      const child = doc.querySelector('scoped-slot-connectedcallback-child');
      const connectedAttr = child.getAttribute('data-connected-slot-available');
      const willLoadAttr = child.getAttribute('data-willload-slot-available');

      // Both connectedCallback and componentWillLoad should have access to slotted content
      expect(connectedAttr).toBe('true');
      expect(willLoadAttr).toBe('true');
    });

    it('should render slotted content correctly', async () => {
      const slottedContent = doc.querySelector('#slotted-content');
      expect(slottedContent).toBeTruthy();
      expect(slottedContent.textContent).toBe('Slotted Content');

      const wrapper = doc.querySelector('.wrapper');
      const text = wrapper.textContent;
      expect(text).toContain('Before slot');
      expect(text).toContain('Slotted Content');
      expect(text).toContain('After slot');
    });
  });
});

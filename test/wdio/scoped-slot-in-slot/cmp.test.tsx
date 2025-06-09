import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('scoped-slot-in-slot', () => {
  let host: HTMLElement | undefined;

  beforeEach(async () => {
    render({
      template: () => (
        <ion-host>
          <span slot="label">Label text</span>
          <span slot="suffix">Suffix text</span>
          <span slot="message">Message text</span>
        </ion-host>
      ),
    });
    host = document.querySelector('ion-host');
  });

  it('correctly renders content slotted through multiple levels of nested slots', async () => {
    expect(host).toBeDefined();

    // Check the parent content
    await browser.waitUntil(async () => {
      const parent = host.querySelector('ion-parent');
      return parent && parent.firstElementChild;
    });
    const parent = host.querySelector('ion-parent');
    expect(parent.firstElementChild.tagName).toBe('LABEL');

    // Ensure the label slot content made it through
    const span = parent.firstElementChild.firstElementChild;
    expect(span).toBeDefined();
    expect(span.tagName).toBe('SPAN');
    expect(span.textContent).toBe('Label text');

    // Ensure the message slot content made it through
    expect(parent.lastElementChild.tagName).toBe('SPAN');
    expect(parent.lastElementChild.textContent).toBe('Message text');

    // Check the child content
    const child = parent.querySelector('ion-child');
    expect(child).toBeDefined();

    // Ensure the suffix slot content made it through
    await browser.waitUntil(async () => child.firstElementChild.firstElementChild);
    expect(child.firstElementChild.firstElementChild.tagName).toBe('SPAN');
    expect(child.firstElementChild.firstElementChild.textContent).toBe('Suffix text');
  });
});

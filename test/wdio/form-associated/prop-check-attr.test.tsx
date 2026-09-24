import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { browser, expect } from '@wdio/globals';

describe('form associated boolean attributes', function () {
  let container: HTMLElement;

  beforeEach(async () => {
    render({
      components: [],
      template: () => <div id="attr-container"></div>,
    });
    container = document.querySelector('#attr-container');
  });

  const getText = (el: Element) => el.shadowRoot?.querySelector('p')?.textContent;

  it('treats a parsed `disabled="false"` attribute as true', async () => {
    container.innerHTML = `<form-associated-prop-check disabled="false"></form-associated-prop-check>`;
    const cmp = container.querySelector('form-associated-prop-check');

    await browser.waitUntil(async () => getText(cmp) === 'Disabled prop value: true');
    expect(cmp.disabled).toBe(true);
  });

  it('treats `setAttribute("disabled", "false")` as true and attribute removal as false', async () => {
    container.innerHTML = `<form-associated-prop-check></form-associated-prop-check>`;
    const cmp = container.querySelector('form-associated-prop-check');
    await browser.waitUntil(async () => getText(cmp) === 'Disabled prop value: undefined');

    cmp.setAttribute('disabled', 'false');
    await browser.waitUntil(async () => getText(cmp) === 'Disabled prop value: true');
    expect(cmp.disabled).toBe(true);

    cmp.removeAttribute('disabled');
    await browser.waitUntil(async () => getText(cmp) === 'Disabled prop value: false');
    expect(cmp.disabled).toBe(false);
  });
});

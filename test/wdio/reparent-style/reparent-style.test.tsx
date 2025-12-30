import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('reparent behavior (style)', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <div class="reparent-container">
          <reparent-style-with-vars></reparent-style-with-vars>
          <reparent-style-no-vars></reparent-style-no-vars>
          <button class="reparent-vars">Reparent (with vars)</button>
          <button class="reparent-no-vars">Reparent (no vars)</button>
        </div>
      ),
    });
    await $('.reparent-vars').waitForExist();
    const reparentContainer = document.querySelector('.reparent-container');
    document.querySelector('.reparent-vars').addEventListener('click', () => {
      const component = document.querySelector('reparent-style-with-vars');
      reparentContainer.appendChild(component);
    });
    document.querySelector('.reparent-no-vars').addEventListener('click', () => {
      const component = document.querySelector('reparent-style-no-vars');
      reparentContainer.appendChild(component);
    });
  });

  it('should have styles applied by default', async () => {
    const varsContainer = document.querySelector('reparent-style-with-vars');
    const novarsContainer = document.querySelector('reparent-style-no-vars');

    expect(window.getComputedStyle(varsContainer).backgroundColor).toBe('rgb(0, 0, 255)');
    expect(window.getComputedStyle(novarsContainer).backgroundColor).toBe('rgb(0, 128, 128)');
  });

  it('should preserve styles after reparenting a component (no css vars)', async () => {
    const reparentButton = $('.reparent-no-vars');
    await reparentButton.click();

    await $('reparent-style-no-vars').waitForExist();
    const novars = document.querySelector('reparent-style-no-vars');
    expect(window.getComputedStyle(novars).backgroundColor).toBe('rgb(0, 128, 128)');
  });

  it('should preserve styles after reparenting a component (with css vars)', async () => {
    const reparentButton = $('.reparent-vars');
    await reparentButton.click();

    await $('reparent-style-with-vars').waitForExist();
    const vars = document.querySelector('reparent-style-with-vars');
    expect(window.getComputedStyle(vars).backgroundColor).toBe('rgb(0, 0, 255)');
  });
});

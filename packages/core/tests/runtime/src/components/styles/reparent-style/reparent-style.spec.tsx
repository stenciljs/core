import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('reparent behavior (style)', () => {
  it('should have styles applied by default', async () => {
    await render(
      <div class="reparent-container">
        <reparent-style-with-vars></reparent-style-with-vars>
        <reparent-style-no-vars></reparent-style-no-vars>
      </div>,
    );
    await waitForExist('reparent-style-with-vars.hydrated');
    await waitForExist('reparent-style-no-vars.hydrated');
    const varsContainer = document.querySelector('reparent-style-with-vars')!;
    const novarsContainer = document.querySelector('reparent-style-no-vars')!;

    expect(window.getComputedStyle(varsContainer).backgroundColor).toBe('rgb(0, 0, 255)');
    expect(window.getComputedStyle(novarsContainer).backgroundColor).toBe('rgb(0, 128, 128)');
  });

  it('should preserve styles after reparenting a component (no css vars)', async () => {
    const { waitForChanges } = await render(
      <div class="reparent-container">
        <reparent-style-with-vars></reparent-style-with-vars>
        <reparent-style-no-vars></reparent-style-no-vars>
        <button class="reparent-no-vars">Reparent (no vars)</button>
      </div>,
    );
    await waitForExist('reparent-style-with-vars.hydrated');
    await waitForExist('reparent-style-no-vars.hydrated');
    const reparentContainer = document.querySelector('.reparent-container')!;
    document.querySelector('.reparent-no-vars')!.addEventListener('click', () => {
      const component = document.querySelector('reparent-style-no-vars')!;
      reparentContainer.appendChild(component);
    });

    (document.querySelector('.reparent-no-vars') as HTMLButtonElement).click();
    await waitForChanges();

    const novars = document.querySelector('reparent-style-no-vars')!;
    expect(window.getComputedStyle(novars).backgroundColor).toBe('rgb(0, 128, 128)');
  });

  it('should preserve styles after reparenting a component (with css vars)', async () => {
    const { waitForChanges } = await render(
      <div class="reparent-container">
        <reparent-style-with-vars></reparent-style-with-vars>
        <reparent-style-no-vars></reparent-style-no-vars>
        <button class="reparent-vars">Reparent (with vars)</button>
      </div>,
    );
    await waitForExist('reparent-style-with-vars.hydrated');
    await waitForExist('reparent-style-no-vars.hydrated');
    const reparentContainer = document.querySelector('.reparent-container')!;
    document.querySelector('.reparent-vars')!.addEventListener('click', () => {
      const component = document.querySelector('reparent-style-with-vars')!;
      reparentContainer.appendChild(component);
    });

    (document.querySelector('.reparent-vars') as HTMLButtonElement).click();
    await waitForChanges();

    const vars = document.querySelector('reparent-style-with-vars')!;
    expect(window.getComputedStyle(vars).backgroundColor).toBe('rgb(0, 0, 255)');
  });
});

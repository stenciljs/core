import { Fragment, render, h, describe, it, expect } from '@stencil/vitest';

/**
 * Tests for the patched `removeChild()` method on `scoped` components.
 */
describe('remove-child-patch', () => {
  it('should remove the last slotted node', async () => {
    const { waitForChanges } = await render(
      <>
        <remove-child-patch>
          <span>Slotted 1</span>
          <span>Slotted 2</span>
        </remove-child-patch>
        <button id="remove-child-button" type="button">
          Remove Last Child
        </button>
      </>,
    );

    const host = document.querySelector('remove-child-patch')!;
    document.querySelector('#remove-child-button')!.addEventListener('click', () => {
      const slotContainer = host.querySelector('.slot-container')!;
      const elementToRemove = slotContainer.children[slotContainer.children.length - 1];
      host.removeChild(elementToRemove);
    });

    let spans = host.querySelectorAll('span');
    expect(spans).toHaveLength(2);

    (document.querySelector('#remove-child-button') as HTMLButtonElement).click();
    await waitForChanges();

    spans = host.querySelectorAll('span');
    expect(spans).toHaveLength(1);
  });

  it('should show slot-fb if the last slotted node is removed', async () => {
    const { waitForChanges } = await render(
      <>
        <remove-child-patch>
          <span>Slotted 1</span>
          <span>Slotted 2</span>
        </remove-child-patch>
        <button id="remove-child-button" type="button">
          Remove Last Child
        </button>
      </>,
    );

    const host = document.querySelector('remove-child-patch')!;
    document.querySelector('#remove-child-button')!.addEventListener('click', () => {
      const slotContainer = host.querySelector('.slot-container')!;
      const elementToRemove = slotContainer.children[slotContainer.children.length - 1];
      host.removeChild(elementToRemove);
    });

    let spans = host.querySelectorAll('span');
    expect(spans).toHaveLength(2);

    const button = document.querySelector('#remove-child-button') as HTMLButtonElement;
    button.click();
    await waitForChanges();
    button.click();
    await waitForChanges();

    spans = host.querySelectorAll('span');
    expect(spans).toHaveLength(0);
    expect(host.querySelector('.slot-container')).toHaveTextContent('Slot fallback content');
  });

  it('should still be able to remove nodes not slotted', async () => {
    const { waitForChanges } = await render(
      <>
        <remove-child-patch>
          <span>Slotted 1</span>
        </remove-child-patch>
        <button id="remove-child-div-button" type="button">
          Remove Child Div
        </button>
      </>,
    );

    const host = document.querySelector('remove-child-patch')!;
    document.querySelector('#remove-child-div-button')!.addEventListener('click', () => {
      const elementToRemove = host.querySelector('div');
      if (elementToRemove) {
        host.removeChild(elementToRemove);
      }
    });

    expect(host.querySelector('div')).toBeTruthy();

    (document.querySelector('#remove-child-div-button') as HTMLButtonElement).click();
    await waitForChanges();

    expect(host.querySelector('div')).toBeFalsy();
  });
});

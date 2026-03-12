import { Fragment, render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('dom-reattach-clone', () => {
  const clone = (id: string): void => {
    const element = document.querySelector('#' + id + '.hydrated');
    const parent = document.querySelector('#' + id + '-parent');
    parent!.appendChild(element!.cloneNode(true));
  };

  const runTest = async (id: string, paragraphs: number, waitForChanges: () => Promise<void>) => {
    await waitForExist(`#${id}.hydrated`);

    const component = document.querySelector(`#${id}`)!;
    const parent = document.querySelector(`#${id}-parent`)!;

    clone(id);
    clone(id);
    await waitForChanges();

    expect(component.querySelectorAll('.component-mark-up')).toHaveLength(1);
    // each successive `dom-reattach-clone-*` element has one more `p` element than its predecessor in the DOM
    // (see the markup in the template above)
    expect(component.querySelectorAll('p')).toHaveLength(paragraphs);

    expect(parent.querySelectorAll('.component-mark-up')).toHaveLength(3);
    expect(parent.querySelectorAll('p')).toHaveLength(paragraphs * 3);
  };

  it('should not double render', async () => {
    const { waitForChanges } = await render(
      <div id="simple-parent">
        <dom-reattach-clone id="simple">
          <p>Slot content 1</p>
        </dom-reattach-clone>
      </div>,
    );
    await runTest('simple', 1, waitForChanges);
  });

  it('should not double render with deeper slots', async () => {
    const { waitForChanges } = await render(
      <div id="deep-parent">
        <dom-reattach-clone-deep-slot id="deep">
          <p>Slot content 1</p>
          <p>Slot content 2</p>
        </dom-reattach-clone-deep-slot>
      </div>,
    );
    await runTest('deep', 2, waitForChanges);
  });

  it('should not double render with multiple slots', async () => {
    const { waitForChanges } = await render(
      <div id="multiple-parent">
        <dom-reattach-clone id="multiple">
          <p>Slot content 1</p>
          <p>Slot content 2</p>
          <p>Slot content 3</p>
        </dom-reattach-clone>
      </div>,
    );
    await runTest('multiple', 3, waitForChanges);
  });

  it('should not double render with Host element', async () => {
    const { waitForChanges } = await render(
      <div id="host-parent">
        <dom-reattach-clone-host id="host">
          <p>Slot content 1</p>
          <p>Slot content 2</p>
          <p>Slot content 3</p>
          <p>Slot content 4</p>
        </dom-reattach-clone-host>
      </div>,
    );
    await runTest('host', 4, waitForChanges);
  });
});

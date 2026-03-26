import { render, h, describe, it, expect, waitForStable, waitForExist } from '@stencil/vitest';
import { Fragment } from '@stencil/core';

let childIdx = 1;
if (__STENCIL_PROD__) {
  //in dev mode, stencil adds `<style>` elements
  childIdx = 0;
}

describe('lifecycle-unload', () => {
  it('fire unload methods', async () => {
    const { waitForChanges } = await render(
      <>
        <div id='lifecycle-unload-results'></div>
        <hr />
        <lifecycle-unload-root></lifecycle-unload-root>
      </>,
      { waitForReady: false },
    );

    await waitForExist('lifecycle-update-a.hydrated');
    let main = document.body
      .querySelector('lifecycle-unload-a')!
      .shadowRoot!.querySelector('main')!;
    const children = main.children;

    expect(children[0].textContent!.trim()).toBe('cmp-a - top');
    expect(children[1].textContent!.trim()).toBe('cmp-a - middle');
    expect(children[2].textContent!.trim()).toBe('cmp-a - bottom');

    expect((children[1] as HTMLElement).shadowRoot!.children[childIdx].textContent!.trim()).toBe(
      'cmp-b - top',
    );
    expect(
      (children[1] as HTMLElement).shadowRoot!.children[childIdx + 1].textContent!.trim(),
    ).toBe('');
    expect(
      (children[1] as HTMLElement).shadowRoot!.children[childIdx + 2].textContent!.trim(),
    ).toBe('cmp-b - bottom');
    let unload = document.body.querySelector('#lifecycle-unload-results')!;
    expect(unload.children.length).toBe(0);

    document.querySelector('button')!.click();
    await waitForChanges();

    // Wait for component to be removed
    // await new Promise((resolve) => setTimeout(resolve, 100));

    const cmpA = document.body.querySelector('lifecycle-unload-a');
    expect(cmpA).toBe(null);

    unload = document.body.querySelector('#lifecycle-unload-results')!;
    expect(unload.children[0].textContent!.trim()).toBe('cmp-a unload');
    expect(unload.children[1].textContent!.trim()).toBe('cmp-b unload');
    expect(unload.children.length).toBe(2);

    document.querySelector('button')!.click();
    await waitForChanges();

    main = document.body.querySelector('lifecycle-unload-a')!.shadowRoot!.querySelector('main')!;
    expect(main.children[0].textContent!.trim()).toBe('cmp-a - top');
    expect(main.children[1].textContent!.trim()).toBe('cmp-a - middle');
    expect(main.children[2].textContent!.trim()).toBe('cmp-a - bottom');
    expect(
      (main.children[1] as HTMLElement).shadowRoot!.children[childIdx].textContent!.trim(),
    ).toBe('cmp-b - top');
    expect(
      (main.children[1] as HTMLElement).shadowRoot!.children[childIdx + 1].textContent!.trim(),
    ).toBe('');
    expect(
      (main.children[1] as HTMLElement).shadowRoot!.children[childIdx + 2].textContent!.trim(),
    ).toBe('cmp-b - bottom');

    document.querySelector('button')!.click();
    await waitForChanges();

    unload = document.body.querySelector('#lifecycle-unload-results')!;
    expect(unload.children[0].textContent!.trim()).toBe('cmp-a unload');
    expect(unload.children[1].textContent!.trim()).toBe('cmp-b unload');
    expect(unload.children[2].textContent!.trim()).toBe('cmp-a unload');
    expect(unload.children[3].textContent!.trim()).toBe('cmp-b unload');
    expect(unload.children.length).toBe(4);
  });
});

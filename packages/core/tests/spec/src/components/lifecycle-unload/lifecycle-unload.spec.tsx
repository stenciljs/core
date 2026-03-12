import { Fragment, render, h, describe, it, expect, waitForStable, waitForExist } from '@stencil/vitest';

describe('lifecycle-unload', () => {
  it('fire unload methods', async () => {
    const { waitForChanges } = await render(
      <>
        <div id="lifecycle-unload-results"></div>
        <hr />
        <lifecycle-unload-root></lifecycle-unload-root>
      </>,
    );

    await waitForStable('lifecycle-unload-a');
    let main = document.body.querySelector('lifecycle-unload-a')!.shadowRoot!.querySelector('main')!;
    const children = main.children;

    expect(children[0].textContent!.trim()).toBe('cmp-a - top');
    expect(children[1].textContent!.trim()).toBe('cmp-a - middle');
    expect(children[2].textContent!.trim()).toBe('cmp-a - bottom');
    expect((children[1] as HTMLElement).shadowRoot!.children[0].textContent!.trim()).toBe('cmp-b - top');
    expect((children[1] as HTMLElement).shadowRoot!.children[1].textContent!.trim()).toBe('');
    expect((children[1] as HTMLElement).shadowRoot!.children[2].textContent!.trim()).toBe('cmp-b - bottom');

    let unload = document.body.querySelector('#lifecycle-unload-results')!;
    expect(unload.children.length).toBe(0);

    document.querySelector('button')!.click();
    await waitForChanges();

    // Wait for component to be removed
    await new Promise((resolve) => setTimeout(resolve, 100));

    const cmpA = document.body.querySelector('lifecycle-unload-a');
    expect(cmpA).toBe(null);

    unload = document.body.querySelector('#lifecycle-unload-results')!;
    expect(unload.children[0].textContent!.trim()).toBe('cmp-a unload');
    expect(unload.children[1].textContent!.trim()).toBe('cmp-b unload');
    expect(unload.children.length).toBe(2);

    document.querySelector('button')!.click();
    await waitForChanges();
    await waitForStable('lifecycle-unload-a');

    main = document.body.querySelector('lifecycle-unload-a')!.shadowRoot!.querySelector('main')!;
    expect(main.children[0].textContent!.trim()).toBe('cmp-a - top');
    expect(main.children[1].textContent!.trim()).toBe('cmp-a - middle');
    expect(main.children[2].textContent!.trim()).toBe('cmp-a - bottom');
    expect((main.children[1] as HTMLElement).shadowRoot!.children[0].textContent!.trim()).toBe('cmp-b - top');
    expect((main.children[1] as HTMLElement).shadowRoot!.children[1].textContent!.trim()).toBe('');
    expect((main.children[1] as HTMLElement).shadowRoot!.children[2].textContent!.trim()).toBe('cmp-b - bottom');

    document.querySelector('button')!.click();
    await waitForChanges();
    await waitForStable('#lifecycle-unload-results');

    unload = document.body.querySelector('#lifecycle-unload-results')!;
    expect(unload.children[0].textContent!.trim()).toBe('cmp-a unload');
    expect(unload.children[1].textContent!.trim()).toBe('cmp-b unload');
    expect(unload.children[2].textContent!.trim()).toBe('cmp-a unload');
    expect(unload.children[3].textContent!.trim()).toBe('cmp-b unload');
    expect(unload.children.length).toBe(4);
  });
});

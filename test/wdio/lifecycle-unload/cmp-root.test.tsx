import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('lifecycle-unload', function () {
  beforeEach(() => {
    render({
      template: () => (
        <>
          <div id="lifecycle-unload-results"></div>
          <hr />
          <lifecycle-unload-root></lifecycle-unload-root>
        </>
      ),
    });
  });

  it('fire unload methods', async () => {
    await $('lifecycle-unload-a').waitForStable();
    let main = document.body.querySelector('lifecycle-unload-a').shadowRoot.querySelector('main');
    const children = main.children;

    expect(children[0].textContent.trim()).toBe('cmp-a - top');
    expect(children[1].textContent.trim()).toBe('cmp-a - middle');
    expect(children[2].textContent.trim()).toBe('cmp-a - bottom');
    expect(children[1].shadowRoot.children[0].textContent.trim()).toBe('cmp-b - top');
    expect(children[1].shadowRoot.children[1].textContent.trim()).toBe('');
    expect(children[1].shadowRoot.children[2].textContent.trim()).toBe('cmp-b - bottom');

    let unload = document.body.querySelector('#lifecycle-unload-results');
    expect(unload.children.length).toBe(0);

    await $('button').click();
    await browser.waitUntil(() => !document.body.querySelector('lifecycle-unload-a'), { timeout: 5000 });
    const cmpA = document.body.querySelector('lifecycle-unload-a');
    expect(cmpA).toBe(null);

    unload = document.body.querySelector('#lifecycle-unload-results');
    expect(unload.children[0].textContent.trim()).toBe('cmp-a unload');
    expect(unload.children[1].textContent.trim()).toBe('cmp-b unload');
    expect(unload.children.length).toBe(2);

    await $('button').click();
    await $('lifecycle-unload-a').waitForStable();

    main = document.body.querySelector('lifecycle-unload-a').shadowRoot.querySelector('main');
    expect(main.children[0].textContent.trim()).toBe('cmp-a - top');
    expect(main.children[1].textContent.trim()).toBe('cmp-a - middle');
    expect(main.children[2].textContent.trim()).toBe('cmp-a - bottom');
    expect(main.children[1].shadowRoot.children[0].textContent.trim()).toBe('cmp-b - top');
    expect(main.children[1].shadowRoot.children[1].textContent.trim()).toBe('');
    expect(main.children[1].shadowRoot.children[2].textContent.trim()).toBe('cmp-b - bottom');

    await $('button').click();
    await $('#lifecycle-unload-results').waitForStable();

    unload = document.body.querySelector('#lifecycle-unload-results');
    expect(unload.children[0].textContent.trim()).toBe('cmp-a unload');
    expect(unload.children[1].textContent.trim()).toBe('cmp-b unload');
    expect(unload.children[2].textContent.trim()).toBe('cmp-a unload');
    expect(unload.children[3].textContent.trim()).toBe('cmp-b unload');
    expect(unload.children.length).toBe(4);
  });
});

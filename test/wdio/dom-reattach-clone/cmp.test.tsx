import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('dom-reattach-clone', function () {
  const clone = (id: string): void => {
    const element = document.querySelector('#' + id + '.hydrated');
    const parent = document.querySelector('#' + id + '-parent');
    parent.appendChild(element.cloneNode(true));
  };

  beforeEach(() => {
    render({
      template: () => (
        <>
          <style>button {{ display: 'block' }}</style>
          <div id="simple-parent">
            <button onClick={() => clone('simple')} id="clone-simple">
              Clone simple
            </button>
            <dom-reattach-clone id="simple">
              <p>Slot content 1</p>
            </dom-reattach-clone>
          </div>

          <div id="deep-parent">
            <button onClick={() => clone('deep')} id="clone-deep">
              Clone deep
            </button>
            <dom-reattach-clone-deep-slot id="deep">
              <p>Slot content 1</p>
              <p>Slot content 2</p>
            </dom-reattach-clone-deep-slot>
          </div>

          <div id="multiple-parent">
            <button onClick={() => clone('multiple')} id="clone-multiple">
              Clone multiple
            </button>
            <dom-reattach-clone id="multiple">
              <p>Slot content 1</p>
              <p>Slot content 2</p>
              <p>Slot content 3</p>
            </dom-reattach-clone>
          </div>

          <div id="host-parent">
            <button onClick={() => clone('host')} id="clone-host">
              Clone host
            </button>
            <dom-reattach-clone-host id="host">
              <p>Slot content 1</p>
              <p>Slot content 2</p>
              <p>Slot content 3</p>
              <p>Slot content 4</p>
            </dom-reattach-clone-host>
          </div>
        </>
      ),
    });
  });

  const runTest = async (id: string, paragraphs: number) => {
    await $(`#${id}`).waitForExist();

    const component = $(`#${id}`);
    const parent = $(`#${id}-parent`);

    const button = await $(`#clone-${id}`);

    await button.click();
    await button.click();

    await expect(await component.$$('.component-mark-up')).toHaveLength(1);
    // each successive `dom-reattach-clone-*` element has one more `p` element than its predecessor in the DOM
    // (see the markup in the template above)
    await expect(await component.$$('p')).toHaveLength(paragraphs);

    await expect(await parent.$$('.component-mark-up')).toHaveLength(3);
    await expect(await parent.$$('p')).toHaveLength(paragraphs * 3);
  };

  it('should not double render', async () => {
    await $('#simple.hydrated').waitForExist();
    await runTest('simple', 1);
  });

  it('should not double render with deeper slots', async () => {
    await $('#deep.hydrated').waitForExist();
    await runTest('deep', 2);
  });

  it('should not double render with multiple slots', async () => {
    await $('#multiple.hydrated').waitForExist();
    await runTest('multiple', 3);
  });

  it('should not double render with Host element', async () => {
    await $('#host.hydrated').waitForExist();
    await runTest('host', 4);
  });
});

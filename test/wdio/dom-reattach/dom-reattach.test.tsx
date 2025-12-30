import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('dom-reattach', function () {
  let showElement = true;

  beforeEach(() => {
    render({
      components: [],
      template: () => (
        <>
          <button onClick={reattach}>Toggle</button>
          <dom-reattach></dom-reattach>
        </>
      ),
    });

    const element = document.querySelector('dom-reattach');
    function reattach() {
      if (showElement) {
        element.remove();
      } else {
        document.body.appendChild(element);
      }
      showElement = !showElement;
    }
  });

  it('should have proper values', async () => {
    const lifecycleTextWithDisconnectCount = (disconnectCount: number) => `componentWillLoad: 1
componentDidLoad: 1
disconnectedCallback: ${disconnectCount}`;

    const $cmp = $('dom-reattach').$('div');
    await expect($cmp).toHaveText(lifecycleTextWithDisconnectCount(0));

    await $('button').click();
    await expect($cmp).not.toExist();

    await $('button').click();
    await expect($cmp).toHaveText(lifecycleTextWithDisconnectCount(1));

    await $('button').click();
    await expect($cmp).not.toExist();

    await $('button').click();
    await expect($cmp).toHaveText(lifecycleTextWithDisconnectCount(2));
  });
});

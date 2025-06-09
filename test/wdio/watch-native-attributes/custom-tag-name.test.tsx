import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

import { WatchNativeAttributes } from '../test-components/watch-native-attributes.js';

describe('watch native attributes', () => {
  beforeEach(() => {
    customElements.define('some-custom-element', WatchNativeAttributes);
    render({
      template: () => <some-custom-element aria-label="myStartingLabel"></some-custom-element>,
    });
  });

  it('triggers the callback for the watched attribute', async () => {
    const $cmp = $('some-custom-element');
    await $cmp.waitForExist();

    await expect($cmp).toHaveText('Label: myStartingLabel\nCallback triggered: false');

    const cmp = document.querySelector('some-custom-element');
    cmp.setAttribute('aria-label', 'myNewLabel');

    await expect($cmp).toHaveText('Label: myNewLabel\nCallback triggered: true');
  });
});

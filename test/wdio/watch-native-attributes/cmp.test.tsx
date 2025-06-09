import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('watch native attributes', () => {
  beforeEach(() => {
    render({
      template: () => <watch-native-attributes aria-label="myStartingLabel"></watch-native-attributes>,
    });
  });

  it('triggers the callback for the watched attribute', async () => {
    const $cmp = $('watch-native-attributes');
    await $cmp.waitForExist();

    await expect($cmp).toHaveText('Label: myStartingLabel\nCallback triggered: false');

    const cmp = document.querySelector('watch-native-attributes');
    cmp.setAttribute('aria-label', 'myNewLabel');

    await expect($cmp).toHaveText('Label: myNewLabel\nCallback triggered: true');
  });
});

import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('watch native attributes w/ no Stencil members', () => {
  beforeEach(() => {
    render({
      template: () => (
        <watch-native-attributes-no-members aria-label="myStartingLabel"></watch-native-attributes-no-members>
      ),
    });
  });

  it('triggers the callback for the watched attribute', async () => {
    const $cmp = $('watch-native-attributes-no-members');
    await $cmp.waitForExist();

    await expect($cmp).toHaveText('Label: myStartingLabel\nCallback triggered: false');

    const cmp = document.querySelector('watch-native-attributes-no-members');
    cmp.setAttribute('aria-label', 'myNewLabel');

    await expect($cmp).toHaveText('Label: myNewLabel\nCallback triggered: true');
  });
});

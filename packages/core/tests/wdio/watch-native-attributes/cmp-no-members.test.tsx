import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('watch native attributes w/ no Stencil members', () => {
  beforeEach(() => {
    render({
      components: [],
      template: () => (
        <watch-native-attributes-no-members aria-label="myStartingLabel"></watch-native-attributes-no-members>
      ),
    });
  });

  it('triggers the callback for the watched attribute', async () => {
    const $cmp = $('watch-native-attributes-no-members').$('div');
    await $cmp.waitForExist();

    await expect($cmp).toHaveText('Label: myStartingLabel\nCallback triggered: false');

    const cmp = document.querySelector('watch-native-attributes-no-members');
    cmp.setAttribute('aria-label', 'myNewLabel');

    await expect($cmp).toHaveText('Label: myNewLabel\nCallback triggered: true');
  });
});

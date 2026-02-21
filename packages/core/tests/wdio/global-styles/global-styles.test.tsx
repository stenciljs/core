import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

import { defineCustomElement } from '../test-components/global-styles.js';

describe('dom-reattach', function () {
  beforeEach(() => {
    defineCustomElement();

    render({
      components: [],
      template: () => <global-styles></global-styles>,
    });
  });

  it('should have proper values', async () => {
    await expect(await $('global-styles').getCSSProperty('border')).toEqual(
      expect.objectContaining({
        value: '5px dotted rgb(255, 0, 0)',
      }),
    );
  });
});

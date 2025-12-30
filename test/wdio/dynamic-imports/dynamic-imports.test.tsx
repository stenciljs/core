import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

import type { DynamicImport } from './dynamic-import.js';

describe('tag-names', () => {
  beforeEach(() => {
    render({
      components: [],
      template: () => <dynamic-import></dynamic-import>,
    });
  });

  it('should load content from dynamic import', async () => {
    await expect($('dynamic-import').$('div')).toHaveText('1 hello1 world1');

    const dynamicImport = document.querySelector('dynamic-import') as unknown as HTMLElement & DynamicImport;
    dynamicImport.update();

    await expect($('dynamic-import').$('div')).toHaveText('2 hello2 world2');
  });
});

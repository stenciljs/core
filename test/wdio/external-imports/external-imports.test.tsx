import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

describe('external-imports', () => {
  beforeEach(async () => {
    render({
      components: [],
      template: () => (
        <>
          <external-import-a></external-import-a>
          <external-import-b></external-import-b>
          <external-import-c></external-import-c>
        </>
      ),
    });
  });

  it('render all components without errors', async () => {
    const elm = $('external-import-a').$('div');
    await expect(elm).toHaveText('Marty McFly');

    const elm2 = $('external-import-b').$('div');
    await expect(elm2).toHaveText('Marty McFly');

    const elm3 = $('external-import-c').$('div');
    await expect(elm3).toHaveText('Marty McFly');
  });
});

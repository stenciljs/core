import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('external-imports', () => {
  beforeEach(async () => {
    render({
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
    const elm = $('external-import-a');
    await expect(elm).toHaveText('Marty McFly');

    const elm2 = $('external-import-b');
    await expect(elm2).toHaveText('Marty McFly');

    const elm3 = $('external-import-c');
    await expect(elm3).toHaveText('Marty McFly');
  });
});

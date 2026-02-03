import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

const css = `main {
  background: rgba(0, 0, 0, 1);
  padding: 30px;
}
header {
  background: rgba(230, 230, 230, 1);
  padding: 30px;
}
section {
  background: rgba(160, 160, 160, 1);
  padding: 30px;
}
footer {
  background: rgba(100, 100, 100, 1);
  padding: 30px;
}
nav {
  background: rgba(50, 50, 50, 1);
  padding: 30px;
}`;

describe('conditional-rerender', () => {
  beforeEach(() => {
    render({
      template: () => (
        <>
          <style>{css}</style>
          <conditional-rerender-root></conditional-rerender-root>
        </>
      ),
    });
  });

  it('contains a button as a child', async () => {
    await expect($('main')).toHaveText('Header\nContent\nFooter\nNav');
  });
});

import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('reflect-nan-attribute-hyphen', () => {
  beforeEach(() => {
    render({
      // The string 'NaN' will be interpreted as a number by Stencil, based on the type declaration on the prop tied to
      // the 'val-num' attribute
      template: () => <reflect-nan-attribute-hyphen val-num="NaN"></reflect-nan-attribute-hyphen>,
    });
  });

  it('renders the component the correct number of times', async () => {
    await expect($('reflect-nan-attribute-hyphen')).toHaveText('reflect-nan-attribute-hyphen Render Count: 1');
  });
});

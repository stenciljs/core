import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('reflect-nan-attribute', () => {
  beforeEach(() => {
    render({
      // The string 'NaN' will be interpreted as a number by Stencil, based on
      // the type declaration on the prop tied to the 'val' attribute
      template: () => <reflect-nan-attribute val="NaN"></reflect-nan-attribute>,
    });
  });

  it('renders the component the correct number of times', async () => {
    await expect($('reflect-nan-attribute')).toHaveText('reflect-nan-attribute Render Count: 1');
  });
});

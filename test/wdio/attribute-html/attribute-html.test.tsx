import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('attribute-html', () => {
  before(async () => {
    render({
      template: () => <attribute-html-root str-attr="my string" any-attr="0" nu-attr="12"></attribute-html-root>,
    });
  });

  it('should have proper values', async () => {
    await expect($('#str-attr')).toHaveText('my string string');
    await expect($('#any-attr')).toHaveText('0 string');
    await expect($('#nu-attr')).toHaveText('12 number');
  });
});

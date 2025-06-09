import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

import { renderToString } from '../hydrate/index.mjs';

describe('dsd-cmp', () => {
  it('verifies that Stencil properly picks up the Declarative Shadow DOM', async () => {
    const { html } = await renderToString(`<dsd-cmp />`, {
      fullDocument: true,
      serializeShadowRoot: true,
      constrainTimeouts: false,
    });

    expect(html).toContain('I am rendered on the Server!');
    render({ html, components: [] });
    await expect($('dsd-cmp')).toHaveText('I am rendered on the Client!');
  });
});

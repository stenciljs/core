import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $ } from '@wdio/globals';

describe('shared-jsx', () => {
  beforeEach(() => {
    return render({
      components: [],
      template: () => (
        <>
          <bad-shared-jsx></bad-shared-jsx>
          <hr />
          <factory-jsx></factory-jsx>
        </>
      ),
    });
  });
  it('should not share JSX nodes', async () => {
    const html = await $('stencil-stage').getHTML();
    expect(html).toBe(`<stencil-stage>
  <bad-shared-jsx class="hydrated">
    <div>
      <div>Do Not Share JSX Nodes!</div>
      <div>Do Not Share JSX Nodes!</div>
    </div>
  </bad-shared-jsx>
  <hr />
  <factory-jsx class="hydrated">
    <div>
      <div>Factory JSX</div>
      <div>Factory JSX</div>
    </div>
  </factory-jsx>
</stencil-stage>`);
  });
});

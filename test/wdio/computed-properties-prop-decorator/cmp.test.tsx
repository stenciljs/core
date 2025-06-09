import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('computed-properties-prop-decorator', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <computed-properties-prop-decorator></computed-properties-prop-decorator>
          <computed-properties-prop-decorator-reflect></computed-properties-prop-decorator-reflect>
          <button type="button">Change prop values</button>
        </>
      ),
    });

    document.querySelector('button')?.addEventListener('click', () => {
      const cmp = document.querySelector('computed-properties-prop-decorator');
      cmp?.setAttribute('first', 'These');
      cmp?.setAttribute('middle', 'are');
      cmp?.setAttribute('last', 'my props');
    });
  });

  it('correctly sets computed property `@Prop()`s and triggers re-renders', async () => {
    await expect($('computed-properties-prop-decorator')).toHaveText('no content');

    const button = $('button');
    await button.click();

    await expect($('computed-properties-prop-decorator')).toHaveText('These are my props');
  });

  it('has the default value reflected to the correct attribute on the host', async () => {
    const el = $('computed-properties-prop-decorator-reflect');

    await expect(el).toHaveAttribute('first-name', 'no');
    await expect(el).toHaveAttribute('last-name', 'content');
  });
});

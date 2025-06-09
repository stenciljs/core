import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('computed-properties-watch-decorator', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <computed-properties-watch-decorator></computed-properties-watch-decorator>
          <button type="button">Trigger watch callbacks</button>
        </>
      ),
    });
    document.querySelector('button').addEventListener('click', () => {
      const cmp = document.querySelector('computed-properties-watch-decorator');
      cmp.setAttribute('first', 'Bob');
      cmp.setAttribute('last', 'Builder');
    });
  });

  it('triggers the watch callback when the associated prop changes', async () => {
    const el = document.querySelector('computed-properties-watch-decorator');
    await expect(el).toHaveText(['First name called with: not yet', 'Last name called with: not yet'].join('\n'));

    const button = document.querySelector('button');
    expect(button).toBeDefined();

    await $(button).click();

    const firstNameCalledWith = {
      newVal: 'Bob',
      oldVal: 'no',
      attrName: 'first',
    };
    const lastNameCalledWith = {
      newVal: 'Builder',
      oldVal: 'content',
      attrName: 'last',
    };
    await expect(el).toHaveText(
      [
        `First name called with: ${JSON.stringify(firstNameCalledWith)}`,
        `Last name called with: ${JSON.stringify(lastNameCalledWith)}`,
      ].join('\n'),
    );
  });
});

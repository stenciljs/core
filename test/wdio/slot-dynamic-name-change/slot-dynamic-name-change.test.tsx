import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

/**
 * Tests the case where a `slot` element in a component has its
 * `name` attribute changed dynamically via a property.
 */
describe('slot dynamic name change', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <>
          <slot-dynamic-name-change-shadow>
            <p slot="greeting">Hello</p>
            <p slot="farewell">Goodbye</p>
          </slot-dynamic-name-change-shadow>
          <slot-dynamic-name-change-scoped>
            <p slot="greeting">Hello</p>
            <p slot="farewell">Goodbye</p>
          </slot-dynamic-name-change-scoped>

          <button>Toggle slot name</button>
        </>
      ),
    });

    document.querySelector('button').addEventListener('click', () => {
      document.querySelector('slot-dynamic-name-change-shadow').setAttribute('slot-name', 'farewell');
      document.querySelector('slot-dynamic-name-change-scoped').setAttribute('slot-name', 'farewell');
    });
  });

  it('should change the slot name for a shadow component', async () => {
    const cmp = $('slot-dynamic-name-change-shadow');
    await expect(cmp).toHaveText('Hello');
    await expect(cmp.shadow$('slot')).toHaveAttribute('name', 'greeting');

    await $('button').click();

    await expect(cmp).toHaveText('Goodbye');
    await expect(cmp.shadow$('slot')).toHaveAttribute('name', 'farewell');
  });

  it('should change the slot name for a scoped component', async () => {
    const cmp = $('slot-dynamic-name-change-scoped');
    await expect(cmp).toHaveText('Hello');
    await expect(cmp.shadow$('p:not([hidden])')).toHaveAttribute('slot', 'greeting');

    await $('button').click();

    await expect(cmp).toHaveText('Goodbye');
    await expect(cmp.shadow$('p:not([hidden])')).toHaveAttribute('slot', 'farewell');
  });
});

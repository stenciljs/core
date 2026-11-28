import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-dynamic-name-change', () => {
  it('should change the slot name for a shadow component', async () => {
    const { root, waitForChanges } = await render(
      <slot-dynamic-name-change-shadow>
        <p slot='greeting'>Hello</p>
        <p slot='farewell'>Goodbye</p>
      </slot-dynamic-name-change-shadow>,
    );
    await waitForExist('slot-dynamic-name-change-shadow.hydrated');

    const cmp = root;
    expect(cmp).toHaveTextContent('Hello');
    expect(cmp.shadowRoot!.querySelector('slot')).toHaveAttribute('name', 'greeting');

    cmp.setAttribute('slot-name', 'farewell');
    await waitForChanges();

    expect(cmp).toHaveTextContent('Goodbye');
    expect(cmp.shadowRoot!.querySelector('slot')).toHaveAttribute('name', 'farewell');
  });

  it('should change the slot name for a scoped component', async () => {
    const { root, waitForChanges } = await render(
      <slot-dynamic-name-change-scoped>
        <p slot='greeting'>Hello</p>
        <p slot='farewell'>Goodbye</p>
      </slot-dynamic-name-change-scoped>,
    );
    await waitForExist('slot-dynamic-name-change-scoped.hydrated');

    const cmp = root;
    expect(cmp).toHaveTextContent('Hello');
    expect(cmp.querySelector('p:not([hidden])')).toHaveAttribute('slot', 'greeting');

    cmp.setAttribute('slot-name', 'farewell');
    await waitForChanges();

    expect(cmp).toHaveTextContent('Goodbye');
    expect(cmp.querySelector('p:not([hidden])')).toHaveAttribute('slot', 'farewell');
  });
});

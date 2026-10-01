import { render, h, describe, it, expect } from '@stencil/vitest';

describe('computed-properties-watch-decorator', () => {
  it('triggers the watch callback when the associated prop changes', async () => {
    const { root, waitForChanges } = await render(<computed-properties-watch-decorator />);

    const firstNameCalledWithImmediate = {
      newVal: 'no',
      attrName: 'first',
    };
    const lastNameCalledWithImmediate = {
      newVal: 'content',
      attrName: 'last',
    };

    const div = root.querySelector('div')!;
    expect(div).toHaveTextContent(
      [
        'First name called with: not yet',
        'Last name called with: not yet',
        `First name called with immediate: ${JSON.stringify(firstNameCalledWithImmediate)}`,
        `Last name called with immediate: ${JSON.stringify(lastNameCalledWithImmediate)}`,
      ].join(''),
    );

    root.setAttribute('first', 'Bob');
    root.setAttribute('last', 'Builder');
    await waitForChanges();

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
    expect(div).toHaveTextContent(
      [
        `First name called with: ${JSON.stringify(firstNameCalledWith)}`,
        `Last name called with: ${JSON.stringify(lastNameCalledWith)}`,
        `First name called with immediate: ${JSON.stringify(firstNameCalledWith)}`,
        `Last name called with immediate: ${JSON.stringify(lastNameCalledWith)}`,
      ].join(''),
    );
  });
});

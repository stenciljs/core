import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';

describe('slot-children', () => {
  it('get shadow child nodes', async () => {
    const { root } = await render(
      <slot-children-root>
        LightDomA
        <header>LightDomB</header>
        <main>LightDomC</main>
        <footer>LightDomD</footer>
        LightDomE
      </slot-children-root>,
    );
    await waitForExist('slot-children-root.hydrated');

    const elm = root;
    expect(elm!.childElementCount).toBe(3);
  });
});

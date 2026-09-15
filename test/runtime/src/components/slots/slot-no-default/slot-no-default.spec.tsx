import { render, h, describe, it, expect } from '@stencil/vitest';

describe('slot-no-default', () => {
  it('only renders slots that have a location', async () => {
    const { root } = await render(
      <slot-no-default>
        <a slot='a-slot-name'>A-Show</a>
        <header slot='header-slot-name'>Header-No-Show</header>
        <main>Default-Slot-No-Show</main>
        <nav slot='nav-slot-name'>Nav-Show</nav>
        <footer slot='footer-slot-name'>Footer-Show</footer>
      </slot-no-default>,
    );

    expect(root.querySelector('slot-no-default a')).not.toHaveAttribute('hidden');
    expect(root.querySelector('slot-no-default header')).toHaveAttribute('hidden');
    expect(root.querySelector('slot-no-default main')).toHaveAttribute('hidden');
    expect(root.querySelector('slot-no-default nav')).not.toHaveAttribute('hidden');
    expect(root.querySelector('slot-no-default footer')).not.toHaveAttribute('hidden');
  });
});

import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';

describe('slot-no-default', () => {
  beforeEach(async () => {
    render({
      template: () => (
        <slot-no-default>
          <a slot="a-slot-name">A-Show</a>
          <header slot="header-slot-name">Header-No-Show</header>
          <main>Default-Slot-No-Show</main>
          <nav slot="nav-slot-name">Nav-Show</nav>
          <footer slot="footer-slot-name">Footer-Show</footer>
        </slot-no-default>
      ),
    });

    await $('slot-no-default').waitForExist();
  });

  it('only renders slots that have a location', async () => {
    await expect($('slot-no-default a')).not.toHaveAttribute('hidden');
    await expect($('slot-no-default header')).toHaveAttribute('hidden', 'true');
    await expect($('slot-no-default main')).toHaveAttribute('hidden', 'true');
    await expect($('slot-no-default nav')).not.toHaveAttribute('hidden');
    await expect($('slot-no-default footer')).not.toHaveAttribute('hidden');
  });
});

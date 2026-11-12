import { setMode } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { describe, expect, it } from 'vitest';

import { MyButton } from './fixtures/my-button';
import { MyCard } from './fixtures/my-card';
import { MyMode } from './fixtures/my-mode';

describe('stencilSpecPage + newSpecPage integration', () => {
  it('renders a plain component and reacts to prop changes', async () => {
    const page = await newSpecPage({
      components: [MyButton],
      html: `<my-button label="Save"></my-button>`,
    });
    expect(page.root!.shadowRoot!.textContent).toBe('Save');

    page.root!.label = 'Cancel';
    await page.waitForChanges();
    expect(page.root!.shadowRoot!.textContent).toBe('Cancel');
  });

  it('renders a component with styleUrl without crashing (CSS content itself is out of scope)', async () => {
    const page = await newSpecPage({
      components: [MyCard],
      html: `<my-card heading="Hello"></my-card>`,
    });
    expect(page.root!.shadowRoot!.textContent).toBe('Hello');
  });

  it('setMode imported from the bare "@stencil/core" specifier still reaches newSpecPage components', async () => {
    // `setMode` here is deliberately imported from '@stencil/core', not
    // '@stencil/core/testing' - regression test for the resolveId redirect
    // in plugin.ts that keeps both resolving to the same platform instance.
    setMode(() => 'md');
    const page = await newSpecPage({
      components: [MyMode],
      html: `<my-mode></my-mode>`,
    });
    expect(page.root!.shadowRoot!.querySelector('div')!.textContent).toBe('md');
  });
});

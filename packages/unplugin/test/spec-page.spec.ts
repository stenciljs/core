import { newSpecPage } from '@stencil/core/testing';
import { describe, expect, it } from 'vitest';

import { MyButton } from './fixtures/my-button';
import { MyCard } from './fixtures/my-card';

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
});

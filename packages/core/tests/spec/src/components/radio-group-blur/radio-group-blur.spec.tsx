import { render, h, describe, it, expect } from '@stencil/vitest';

describe('radio-group-blur', () => {
  it('should not emit blur event when focusing radio in radio group with slot', async () => {
    const { waitForChanges } = await render(<radio-group-blur-test />);

    // Wait for dynamic radios to be added
    await new Promise((resolve) => setTimeout(resolve, 150));
    await waitForChanges();

    expect(document.querySelector('#blur-count')).toHaveTextContent('0');

    const radio = document.querySelector('ion-radio');
    radio?.click();
    await waitForChanges();

    expect(document.querySelector('#blur-count')).toHaveTextContent('0');
  });

  it('should allow blur events after fast focus change', async () => {
    const { waitForChanges } = await render(<radio-group-blur-test />);

    // Wait for dynamic radios to be added
    await new Promise((resolve) => setTimeout(resolve, 150));
    await waitForChanges();

    const radios = document.querySelectorAll('ion-radio');
    expect(radios.length).toBeGreaterThanOrEqual(2);

    radios[0]?.click();
    await waitForChanges();
    radios[1]?.click();
    await waitForChanges();

    expect(document.querySelector('#blur-count')).toHaveTextContent('1');
  });
});

import { render, h, describe, it, expect } from '@stencil/vitest';
import { userEvent } from 'vitest/browser';

describe('radio-group-blur', () => {
  it('should not emit blur event when focusing radio in radio group with slot', async () => {
    const { waitForChanges } = await render(<radio-group-blur-test />);

    // Wait for dynamic radios to be added
    await new Promise((resolve) => setTimeout(resolve, 150));
    await waitForChanges();

    expect(document.querySelector('#blur-count')).toHaveTextContent('0');

    const radio = document.querySelector('ion-radio')!;
    await userEvent.click(radio);
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

    await userEvent.click(radios[0]);
    await waitForChanges();
    await userEvent.click(radios[1]);
    await waitForChanges();

    expect(document.querySelector('#blur-count')).toHaveTextContent('1');
  });
});

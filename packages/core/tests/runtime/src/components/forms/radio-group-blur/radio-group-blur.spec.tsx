import { render, h, describe, it, expect, waitForExist } from '@stencil/vitest';
import { userEvent } from 'vitest/browser';

describe('radio-group-blur', () => {
  it('should not emit blur event when focusing radio in radio group with slot', async () => {
    const { waitForChanges } = await render(<radio-group-blur-test />);
    await waitForExist('radio-group-blur-test.hydrated');
    await waitForExist('ion-radio.hydrated');
    
    expect(document.querySelector('#blur-count')).toHaveTextContent('0');

    const radio = document.querySelector('ion-radio')!;
    await userEvent.click(radio);
    await waitForChanges();

    expect(document.querySelector('#blur-count')).toHaveTextContent('0');
  });

  it('should allow blur events after fast focus change', async () => {
    const { waitForChanges } = await render(<radio-group-blur-test />);
    await waitForExist('radio-group-blur-test.hydrated');
    await waitForExist('ion-radio.hydrated');

    const radios = document.querySelectorAll('ion-radio');
    expect(radios.length).toBeGreaterThanOrEqual(2);

    await userEvent.click(radios[0]);
    await waitForChanges();
    await userEvent.click(radios[1]);
    await waitForChanges();
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(document.querySelector('#blur-count')).toHaveTextContent('1');
  });
});

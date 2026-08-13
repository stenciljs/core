import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

/**
 * Real-world interop check: @lit/context's ContextProvider/ContextConsumer, composed onto
 * Stencil components via `Mixin(ReactiveControllerHost)`, propagating a value across a real
 * `context-request` DOM event in an actual browser (dist-custom-elements, since that's what a
 * real consumer imports).
 */
test.describe('lit-context interop', () => {
  test('propagates a value from provider to consumer via a real context-request event', async ({
    page,
  }) => {
    await page.goto('/');

    const consumer = page.locator('lit-context-consumer .value');
    await expect(consumer).toHaveText('hello from provider');
  });
});

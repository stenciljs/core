import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

/**
 * Real-world interop check: @lit/context's ContextProvider/ContextConsumer, composed onto
 * Stencil components via `Mixin(ReactiveControllerHost)`, propagating a value across a real
 * `context-request` DOM event in an actual browser. The page loads both the lazy-loaded (`dist`)
 * and standalone (`dist-custom-elements`) builds side by side - the standalone half is registered
 * under `standalone-`-prefixed tag names (via `setTagTransformer`) so both can run without
 * colliding - since a controller that needs real DOM access only works correctly in one of them
 * without the mixin's host-element bridging (see reactive-controller.ts's `connectedCallback`).
 */
test.describe('lit-context interop', () => {
  for (const [label, prefix] of [
    ['lazy', ''],
    ['standalone', 'standalone-'],
  ] as const) {
    test(`propagates a value from provider to consumer via a real context-request event (${label})`, async ({
      page,
    }) => {
      await page.goto('/');

      const consumer = page.locator(`${prefix}lit-context-consumer .value`);
      await expect(consumer).toHaveText('hello from provider');
    });
  }
});

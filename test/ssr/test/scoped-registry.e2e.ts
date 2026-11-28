import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('standalone scoped registry', () => {
  test('defineCustomElement({ registry }) upgrades nested components', async ({ page }) => {
    await page.route('**/scoped-registry', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<!doctype html><html><body>
          <script type="module">
            import { defineCustomElement } from '/standalone/another-car-list.js';
            const registry = new CustomElementRegistry();
            defineCustomElement({ registry });
            const list = document.createElement('another-car-list', { customElementRegistry: registry });
            list.cars = [{ year: 2024, make: 'VW', model: 'Vento' }];
            document.body.appendChild(list);
            window.scopedRegistry = registry;
          </script>
        </body></html>`,
      }),
    );
    await page.goto('/scoped-registry');

    const result = await page.evaluate(async () => {
      const registry = (window as unknown as { scopedRegistry: CustomElementRegistry })
        .scopedRegistry;
      const list = document.querySelector('another-car-list') as HTMLElement & {
        componentOnReady(): Promise<unknown>;
      };
      await list.componentOnReady();
      const detail = list.shadowRoot?.querySelector('another-car-detail');
      return {
        definedGlobally: !!customElements.get('another-car-detail'),
        definedInScope: !!registry.get('another-car-detail'),
        text: detail?.shadowRoot?.textContent,
      };
    });

    expect(result.definedGlobally).toBe(false);
    expect(result.definedInScope).toBe(true);
    expect(result.text).toContain('2024 VW Vento');
  });
});

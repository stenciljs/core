import { Fragment, h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { browser } from '@wdio/globals';

/**
 * Performance test for traditional dist lazy-loader approach.
 *
 * Measures the same metrics as perf.test.tsx for comparison:
 * 1. Time to loader initialization
 * 2. Time to first render (hydrated)
 * 3. Time for dynamically added component
 *
 * Run separately and compare results with auto-loader.
 */
describe('dist lazy-loader performance', () => {
  const metrics: Record<string, number> = {};

  it('should measure loader initialization', async () => {
    const initTime = await browser.execute(() => performance.now());

    // Import and initialize the dist loader
    const { defineCustomElements } = await import('../dist-autoloader-comparison/loader/index.js');
    defineCustomElements();

    const afterImport = await browser.execute(() => performance.now());
    metrics.loaderImport = afterImport - initTime;

    console.log(`\n[PERF] Loader import + defineCustomElements: ${metrics.loaderImport.toFixed(2)}ms`);
  });

  it('should measure initial component render', async () => {
    const startTime = await browser.execute(() => performance.now());

    render({
      components: [],
      template: () => (
        <Fragment>
          <auto-loader-root></auto-loader-root>
        </Fragment>
      ),
    });

    // Wait for component to be defined
    await browser.waitUntil(async () => browser.execute(() => customElements.get('auto-loader-root') !== undefined), {
      timeout: 5000,
    });

    const definedTime = await browser.execute(() => performance.now());
    metrics.timeToDefinition = definedTime - startTime;

    // Wait for render complete (hydrated class or shadow content)
    await browser.waitUntil(
      async () =>
        browser.execute(() => {
          const el = document.querySelector('auto-loader-root');
          return el?.classList.contains('hydrated') || el?.shadowRoot?.querySelector('.root-loaded') !== null;
        }),
      { timeout: 5000 },
    );

    const renderTime = await browser.execute(() => performance.now());
    metrics.timeToRender = renderTime - startTime;

    console.log(`[PERF] Time to definition: ${metrics.timeToDefinition.toFixed(2)}ms`);
    console.log(`[PERF] Time to render: ${metrics.timeToRender.toFixed(2)}ms`);
  });

  it('should measure dynamic component load', async () => {
    const startTime = await browser.execute(() => {
      const start = performance.now();
      const dynamic = document.createElement('auto-loader-dynamic');
      document.body.appendChild(dynamic);
      return start;
    });

    // Wait for dynamic component to render
    await browser.waitUntil(
      async () =>
        browser.execute(() => {
          const el = document.querySelector('auto-loader-dynamic');
          return el?.classList.contains('hydrated') || el?.shadowRoot?.querySelector('.dynamic-loaded') !== null;
        }),
      { timeout: 5000 },
    );

    const endTime = await browser.execute(() => performance.now());
    metrics.dynamicLoad = endTime - startTime;

    console.log(`[PERF] Dynamic component load: ${metrics.dynamicLoad.toFixed(2)}ms`);
  });

  it('should log performance summary', async () => {
    console.log(`\n========== DIST LAZY-LOADER PERFORMANCE ==========`);
    console.log(`Loader init:          ${metrics.loaderImport?.toFixed(2) || 'N/A'}ms`);
    console.log(`Time to definition:   ${metrics.timeToDefinition?.toFixed(2) || 'N/A'}ms`);
    console.log(`Time to render:       ${metrics.timeToRender?.toFixed(2) || 'N/A'}ms`);
    console.log(`Dynamic component:    ${metrics.dynamicLoad?.toFixed(2) || 'N/A'}ms`);
    console.log(`===================================================\n`);
  });
});

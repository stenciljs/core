import { render } from '@stencil/core';
import { describe, it, expect, afterEach } from 'vitest';

const isCustomElementsProject =
  (import.meta as { env?: Record<string, string> }).env?.TEST_PROJECT === 'custom-elements';

// Dynamically import loader only for custom-elements project
let loaderModule: { start: (root?: HTMLElement) => void; stop: () => void } | null = null;
if (isCustomElementsProject) {
  loaderModule = await import('../../../../dist/custom-elements/loader');
}

describe('cross-document-constructed-styles', () => {
  let iframe: HTMLIFrameElement;

  afterEach(() => {
    loaderModule?.stop();
    iframe?.remove();
  });

  it('should render styles in an iframe (cross-document)', async () => {
    // Create an iframe to test cross-document rendering
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    // For `custom-elements` project ensure the component is defined BEFORE rendering.
    // `render()` uses parent document's createElement(), and customElements.upgrade()
    // cannot upgrade elements that have been moved to a different document (the iframe).
    if (isCustomElementsProject) {
      // Trigger the loader to define the component by adding a temporary element to parent doc
      const tempEl = document.createElement('cross-document-style');
      document.body.appendChild(tempEl);
      await customElements.whenDefined('cross-document-style');
      tempEl.remove();
    }

    render(<cross-document-style></cross-document-style>, iframe.contentDocument!.body);
    const el = iframe.contentDocument!.querySelector('cross-document-style')!;

    // Wait for the component to hydrate
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Hydration timeout')), 5000);
      const check = () => {
        if (el.classList.contains('hydrated')) {
          clearTimeout(timeout);
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });

    const computedStyle = iframe.contentWindow!.getComputedStyle(el);
    expect(computedStyle.color).toBe('rgb(255, 0, 0)');
  });
});

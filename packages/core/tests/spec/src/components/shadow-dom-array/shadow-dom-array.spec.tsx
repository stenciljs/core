import { render, h, describe, it, expect } from '@stencil/vitest';

describe('shadow-dom-array', () => {
  it('renders children', async () => {
    const { waitForChanges } = await render(<shadow-dom-array-root></shadow-dom-array-root>);

    const shadowRoot = document.body.querySelector('shadow-dom-array')!.shadowRoot!;

    let expectedLength = 2;
    if (__STENCIL_PROD__) {
      // In dev mode, Stencil adds a <style> element to the shadow root
      expectedLength = 1;
    }

    expect(shadowRoot.children.length).toBe(expectedLength);
    expect(shadowRoot.children[expectedLength - 1].textContent!.trim()).toBe('0');

    const button = document.querySelector('button')!;

    button.click();
    await waitForChanges();

    expect(shadowRoot.children.length).toBe(expectedLength + 1);
    expect(shadowRoot.children[expectedLength].textContent!.trim()).toBe('1');

    button.click();
    await waitForChanges();

    expect(shadowRoot.children.length).toBe(expectedLength + 2);
    expect(shadowRoot.children[expectedLength + 1].textContent!.trim()).toBe('2');
  });
});

/**
 *  ❯  dist (chromium)  src/components/lifecycle-unload/lifecycle-unload.spec.tsx (1 test | 1 failed) 5222ms
     × fire unload methods 5221ms
 ❯  custom-elements (chromium)  src/components/lifecycle-unload/lifecycle-unload.spec.tsx (1 test | 1 failed) 5196ms
     × fire unload methods 5196ms
 ❯  custom-elements (chromium)  src/components/lifecycle-nested/lifecycle-nested.spec.tsx (1 test | 1 failed) 240ms
     × fire load methods in order for nested elements 240ms
 ❯  dist (chromium)  src/components/shadow-dom-array/shadow-dom-array.spec.tsx (1 test | 1 failed) 164ms
     × renders children 164ms
 ❯  custom-elements (chromium)  src/components/shadow-dom-array/shadow-dom-array.spec.tsx (1 test | 1 failed) 133ms
     × renders children 133ms
 */
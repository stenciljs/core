import { h } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { $, expect } from '@wdio/globals';

// @ts-expect-error will be resolved by WDIO
import { defineCustomElement } from '/test-components/dynamic-import.js';

import type { DynamicImport } from './dynamic-import.js';

// Manually define the component since it's excluded from auto-loading
// to prevent pre-loading that would increment module state counters
defineCustomElement();

/**
 * Dynamic Import Feature Tests
 *
 * This test suite validates Stencil's support for dynamic imports (import()) within components.
 * Dynamic imports are crucial for:
 *
 * 1. **Code Splitting**: Breaking large bundles into smaller, lazily-loaded chunks
 * 2. **Performance**: Loading code only when needed, reducing initial bundle size
 * 3. **Runtime Module Loading**: Conditionally loading modules based on user actions or conditions
 * 4. **Tree Shaking**: Better elimination of unused code when modules are loaded on-demand
 *
 * The test component chain demonstrates:
 * - module1.js dynamically imports module3.js
 * - module1.js statically imports module2.js
 * - Each module maintains its own state counter
 * - Multiple calls increment counters independently
 *
 * This pattern is commonly used in real applications for features like:
 * - Loading heavy libraries only when specific features are accessed
 * - Implementing plugin architectures with runtime module loading
 * - Progressive enhancement where advanced features load on-demand
 */
describe('dynamic-imports', () => {
  beforeEach(() => {
    render({
      components: [],
      template: () => <dynamic-import></dynamic-import>,
    });
  });

  /**
   * Tests that dynamic imports work correctly with proper state management.
   *
   * Expected behavior:
   * 1. First load (componentWillLoad): State counters start at 0, increment to 1
   *    - module3 state: 0→1, module2 state: 0→1, module1 state: 0→1
   *    - Result: "1 hello1 world1"
   *
   * 2. Second load (manual update): State counters increment from 1 to 2
   *    - module3 state: 1→2, module2 state: 1→2, module1 state: 1→2
   *    - Result: "2 hello2 world2"
   *
   * This verifies that:
   * - Dynamic imports successfully load and execute modules
   * - Module state persists between dynamic import calls (as expected in browsers)
   * - Multiple invocations work correctly without module re-initialization
   * - The import() promise resolves with the correct module exports
   */
  it('should load content from dynamic import', async () => {
    // First load: componentWillLoad triggers, counters go from 0→1
    await expect($('dynamic-import').$('div')).toHaveText('1 hello1 world1');

    // Manually trigger update to test dynamic import again
    const dynamicImport = document.querySelector('dynamic-import') as unknown as HTMLElement & DynamicImport;
    dynamicImport.update();

    // Second load: counters go from 1→2, demonstrating module state persistence
    await expect($('dynamic-import').$('div')).toHaveText('2 hello2 world2');
  });
});

declare global {
  interface Window {
    __testStart: number;
  }
}

import { defineCustomElements } from '../test-components/index.js';

export default async function () {
  window.__testStart = Date.now();

  /**
   * import components from the test-components package which are build using
   * the `dist-custom-element` output target to validate if the rendering fails
   * with proper error message as the global-script project is run within a
   * lazy load environment.
   */
  defineCustomElements();

  return new Promise((resolve) => setTimeout(() => resolve('done!'), 1000));
}

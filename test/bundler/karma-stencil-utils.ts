const path = require('path');

// we must use a relative path here instead of tsconfig#paths
// see https://github.com/monounity/karma-typescript/issues/315
// Deprecated: replaced by jest-dom-utils.ts
export {};

/**
 * Utilities for creating a test bed to execute HTML rendering tests against
 */
type DomTestUtilities = {
  /**
   * Create and render the HTML at the provided url
   * @param url a location on disk of a file containing the HTML to load
   * @returns the fully rendered HTML to test against
   */
  setupDom: (url: string) => Promise<HTMLElement>;
  /**
   * Clears the test bed of any existing HTML
   */
  tearDownDom: () => void;
};

/**
 * Create setup and teardown methods for DOM based tests. All DOM based tests are created within an application
 * 'test bed' that is managed by this function.
 * @param document a `Document` compliant entity where tests may be rendered
 * @returns utilities to set up the DOM and tear it down within the test bed
 */
//

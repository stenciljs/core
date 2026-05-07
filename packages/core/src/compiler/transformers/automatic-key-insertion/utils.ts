import ts from 'typescript';

let keyCounter = 0;

/**
 * Reset the key counter. Must be called at the start of each render() method
 * so that keys are stable and deterministic per component across re-renders.
 */
export function resetKeyCounter(): void {
  keyCounter = 0;
}

/**
 * Generate a compact unique key for a JSX element within a render() method.
 * Keys are base-36 integers, reset to 0 for each render() method, so they
 * are short (1-2 chars for most components) and stable across re-renders.
 *
 * @param _jsxElement unused — kept for API compatibility
 * @returns a short unique key string
 */
export function deriveJSXKey(_jsxElement: ts.JsxOpeningElement | ts.JsxSelfClosingElement): string {
  return (keyCounter++).toString(36);
}

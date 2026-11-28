import type { ComponentEncapsulation } from '../types.js';

/**
 * Returns the stylesheet boilerplate for `stencil generate`.
 * Shadow and scoped components target `:host`; components without encapsulation target the tag itself.
 * SASS indented syntax uses indentation instead of braces.
 *
 * @param tagName - Dash-case custom element tag name.
 * @param ext - File extension (e.g. `'css'`, `'sass'`, `'scss'`).
 * @param encapsulation - Component encapsulation type. Defaults to `'none'`.
 * @returns Stylesheet source string.
 */
export function getStyleBoilerplate(
  tagName: string,
  ext: string,
  encapsulation: ComponentEncapsulation = 'none',
): string {
  const selector = encapsulation === 'none' ? tagName : ':host';
  return ext === 'sass'
    ? `${selector}\n  display: block\n`
    : `${selector} {\n  display: block;\n}\n`;
}

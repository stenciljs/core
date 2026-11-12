/**
 * Returns the CSS-only component boilerplate for `stencil generate` - a documented tag
 * definition with no backing JS class, no shadow root, and no `customElements.define()`.
 * See `packages/core/src/compiler/css-components/`.
 * SASS indented syntax uses indentation instead of braces.
 *
 * @param tagName - Dash-case custom element tag name.
 * @param ext - File extension (e.g. `'css'`, `'scss'`, `'sass'`, `'less'`). Defaults to `'css'`.
 * @returns Stylesheet source string for the new CSS-only component file.
 */
export function getCssOnlyComponentBoilerplate(tagName: string, ext: string = 'css'): string {
  if (ext === 'sass') {
    return `/**
 * @component
 */
${tagName}
  display: block
`;
  }

  return `/**
 * @component
 */
${tagName} {
  display: block;
}
`;
}

/**
 * Returns the stylesheet boilerplate for `stencil generate`.
 * SASS indented syntax uses indentation instead of braces.
 *
 * @param ext - File extension (e.g. `'css'`, `'sass'`, `'scss'`).
 * @returns Stylesheet source string.
 */
export function getStyleBoilerplate(ext: string): string {
  return ext === 'sass' ? `:host\n  display: block\n` : `:host {\n  display: block;\n}\n`;
}

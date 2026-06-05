/**
 * Returns the stylesheet boilerplate for `stencil generate`.
 * SASS indented syntax uses indentation instead of braces.
 */
export function getStyleBoilerplate(ext: string): string {
  return ext === 'sass'
    ? `:host\n  display: block\n`
    : `:host {\n  display: block;\n}\n`;
}

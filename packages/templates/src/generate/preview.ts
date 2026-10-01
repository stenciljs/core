/**
 * Returns the `usage/example.md` boilerplate for `stencil generate`. Read by the docs
 * pipeline (readme / docs-json / custom-elements-manifest demos) and by the dev server's
 * live component preview.
 *
 * @param tagName - Dash-case custom element tag name.
 * @returns Markdown source string.
 */
export function getUsageExampleBoilerplate(tagName: string): string {
  return `# Example

\`\`\`html
<${tagName}></${tagName}>
\`\`\`
`;
}

/**
 * Returns a standalone index.html boilerplate for `stencil generate`, scoped to a single
 * component's own directory. Its presence opts that directory out of the dev server's
 * auto-generated preview, trading it for a hand-authored demo page.
 *
 * @param tagName - Dash-case custom element tag name.
 * @param entryScriptSrc - Resolved src for the project's browser entry bundle (see
 * `resolveEntryScriptSrc` in the CLI package), or `null` if the project has no browser-loadable
 * output target (e.g. an SSR-only project) - the script tag is omitted in that case.
 * @returns HTML source string.
 */
export function getPreviewHtmlBoilerplate(tagName: string, entryScriptSrc: string | null): string {
  const script = entryScriptSrc
    ? `    <script type="module" src="${entryScriptSrc}"></script>\n`
    : `    <!-- no browser-loadable output target configured - add your own entry script -->\n`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${tagName}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${script}  </head>
  <body>
    <${tagName}></${tagName}>
  </body>
</html>
`;
}

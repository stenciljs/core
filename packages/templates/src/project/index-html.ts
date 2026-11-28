export interface IndexHtmlSelections {
  projectName: string;
  namespace: string;
  globalStyle: boolean;
}

/**
 * Returns src/index.html source for a `www`-output project: entry <script> tag pointing
 * at the compiled bundle, and a <link> to the global stylesheet if one was selected.
 *
 * @param sel - Wizard selections to encode into the HTML file.
 * @returns HTML source string.
 */
export function generateIndexHtml(sel: IndexHtmlSelections): string {
  const fsNamespace = sel.namespace.toLowerCase();

  const headLines = [
    `    <meta charset="UTF-8" />`,
    `    <title>${sel.projectName}</title>`,
    `    <meta name="viewport" content="width=device-width, initial-scale=1" />`,
  ];
  if (sel.globalStyle) {
    headLines.push(`    <link rel="stylesheet" href="/build/${fsNamespace}.css" />`);
  }
  headLines.push(`    <script type="module" src="/build/${fsNamespace}.js"></script>`);

  return [
    `<!doctype html>`,
    `<html lang="en">`,
    `  <head>`,
    ...headLines,
    `  </head>`,
    `  <body>`,
    `    <my-component first="Stencil" last="'Don't call me a framework' JS"></my-component>`,
    `  </body>`,
    `</html>`,
    ``,
  ].join('\n');
}

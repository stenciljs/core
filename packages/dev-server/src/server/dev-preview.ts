import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CompilerBuildResults, ComponentCompilerMeta } from '@stencil/core/compiler';

/**
 * Generate a virtual HTML page for the dev server when no index.html is present.
 *
 * Renders all discovered components. For each component, usage markdown files
 * (src/components/my-cmp/usage/*.md) are scanned for ```html``` code blocks, which
 * are used as preview snippets. Falls back to a bare tag if none are found.
 * @param buildResults The compiler build results containing component metadata and output file information.
 * @param filterDirPath Optional directory path to filter components by (e.g. when visiting /src/my-component/).
 * @returns A string of HTML to be served as the dev preview page.
 */
export const generateDevPreview = (
  buildResults: CompilerBuildResults,
  filterDirPath?: string,
): string => {
  const { namespace } = buildResults;
  let { components } = buildResults;

  if (filterDirPath) {
    const normalized = path.normalize(filterDirPath);
    components = components.filter(
      (c) => path.normalize(path.dirname(c.sourceFilePath)) === normalized,
    );
  }

  const title = filterDirPath ? `${namespace} / ${path.basename(filterDirPath)}` : namespace;
  const loaderUrl = getLoaderUrl(buildResults);
  const globalCssUrls = getGlobalCssUrls(buildResults);

  const sections =
    components.length > 0
      ? components.map((c) => renderComponentSection(c))
      : [
          `  <p style="color:color-mix(in oklab,CanvasText 50%,Canvas 50%)">No Stencil components found in this directory.</p>`,
        ];

  const headAssets = [
    loaderUrl ? `  <script type="module" src="${loaderUrl}"></script>` : '',
    ...globalCssUrls.map((url) => `  <link rel="stylesheet" href="${url}">`),
  ]
    .filter(Boolean)
    .join('\n');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Stencil Dev</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; padding: 2rem; }
    h1 { font-size: 1rem; font-weight: 500; margin: 0 0 2rem; color: color-mix(in oklab, CanvasText 90%, Canvas 10%); }
    .component { border: 1px solid color-mix(in oklab, CanvasText 20%, Canvas 80%); border-radius: 6px; margin-bottom: 1.5rem; overflow: hidden; }
    .component-header { padding: 0.5rem 1rem; background: color-mix(in oklab, CanvasText 5%, Canvas 95%); font-family: monospace; font-size: 0.875rem; }
    .component-description { margin: 0; padding: 0.75rem 1rem 0; font-size: 0.875rem; color: color-mix(in oklab, CanvasText 70%, Canvas 30%); }
    .component-preview { padding: 1.5rem; }
    .component-preview + .component-preview { border-top: 1px dashed color-mix(in oklab, CanvasText 20%, Canvas 80%); }
    .preview-note { margin: 0.75rem 0 0; font-size: 0.8125rem; color: color-mix(in oklab, CanvasText 50%, Canvas 50%); }
    .preview-note code { font-size: 0.8125rem; }
  </style>
${headAssets}
</head>
<body>
  <h1>${title}</h1>
${sections.join('\n')}
</body>
</html>`;
};

const renderComponentSection = (component: ComponentCompilerMeta): string => {
  const snippets = getUsageSnippets(component);
  const previews =
    snippets.length > 0
      ? snippets
          .map((html) => `    <div class="component-preview">\n      ${html}\n    </div>`)
          .join('\n')
      : `    <div class="component-preview">
      <${component.tagName}></${component.tagName}>
      <p class="preview-note">No demos found - add usage examples to <code>usage/*.md</code> (fenced &#96;&#96;&#96;html&#96;&#96;&#96; blocks) to customize this preview.</p>
    </div>`;

  const description = component.docs.text.trim()
    ? `\n    <p class="component-description">${escapeHtml(component.docs.text.trim())}</p>`
    : '';

  return `  <div class="component">
    <div class="component-header">&lt;${component.tagName}&gt;</div>${description}
${previews}
  </div>`;
};

const escapeHtml = (unsafe: string): string =>
  unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const getUsageSnippets = (component: ComponentCompilerMeta): string[] => {
  const usageDir = path.join(path.dirname(component.sourceFilePath), 'usage');
  try {
    const files = fs.readdirSync(usageDir).filter((f) => f.toLowerCase().endsWith('.md'));
    const snippets: string[] = [];
    for (const file of files.sort()) {
      const content = fs.readFileSync(path.join(usageDir, file), 'utf-8');
      for (const match of content.matchAll(/```html\n([\s\S]*?)```/g)) {
        snippets.push(match[1].trim());
      }
    }
    return snippets;
  } catch {
    return [];
  }
};

/**
 * Convert an absolute output file path to a server-relative URL.
 * @param absPath The absolute file path.
 * @param rootDir The root directory to which the path should be relative.
 * @returns A server-relative URL.
 */
const toServePath = (absPath: string, rootDir: string): string =>
  '/' + path.relative(rootDir, absPath).split(path.sep).join('/');

/**
 * Derive the loader script URL from build outputs.
 * Prefers loader-bundle (always built in dev); falls back to standalone auto-loader if present.
 * @param buildResults The compiler build results containing output file information.
 * @returns A server-relative URL to a loader script, or null if not found.
 */
const getLoaderUrl = ({ outputs, fsNamespace, rootDir }: CompilerBuildResults): string | null => {
  // loader-bundle compiles via the internal 'dist-lazy' pipeline — files are tagged with that type
  const distLazy = outputs.find((o) => o.type === 'dist-lazy');
  if (distLazy) {
    // Browser entry is <fsNamespace>.js — exclude the .esm.js backwards-compat shim
    const file = distLazy.files.find((f) => f.endsWith(`/${fsNamespace}.js`));
    if (file) return toServePath(file, rootDir);
  }

  // standalone auto-loader (mutation-observer based, only present when autoLoader is configured
  // and skipInDev is false on the standalone output target)
  const standalone = outputs.find((o) => o.type === 'standalone');
  if (standalone) {
    const file = standalone.files.find((f) => /\/loader\.js$/.test(f));
    if (file) return toServePath(file, rootDir);
  }

  return null;
};

/**
 * Collect server-relative URLs for all global-style CSS outputs.
 * @param buildResults The compiler build results containing output file information.
 * @returns An array of server-relative URLs to global-style CSS files.
 */
const getGlobalCssUrls = ({ outputs, rootDir }: CompilerBuildResults): string[] => {
  const globalStyle = outputs.find((o) => o.type === 'global-style');
  if (!globalStyle) return [];
  return globalStyle.files
    .filter((f) => f.endsWith('.css') && !f.endsWith('.css.map'))
    .map((f) => toServePath(f, rootDir));
};

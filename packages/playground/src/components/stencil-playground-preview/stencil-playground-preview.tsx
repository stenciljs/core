import { Component, Event, getAssetPath, Prop, Watch } from '@stencil/core';
import type { EventEmitter } from '@stencil/core';

import { resolveRelativePath, type CompiledFile } from '../../utils';

const MESSAGE_SOURCE = 'stencil-playground-preview';
const INDEX_HTML_NAME = 'index.html';

export interface PreviewResult {
  ok: boolean;
  message?: string;
}

export interface PreviewInput {
  files: CompiledFile[];
  indexHtml: string | null;
}

const VENDOR_IMPORT_MAP = {
  '@stencil/core/runtime/client/standalone': 'runtime-client-standalone.js',
  '@stencil/core/app-data': 'app-data.js',
  '@stencil/core/app-globals': 'app-globals.js',
  '@stencil/core/signals': 'signals.js',
  '@preact/signals-core': 'signals-core.js',
  '@stencil/core/jsx-runtime': 'runtime-client-standalone.js',
  '@stencil/core/jsx-dev-runtime': 'runtime-client-standalone.js',
};

// A module script, not a classic one: `setErrorHandler` needs a real `import` from the same
// vendor module instance the compiled components import from, so it sets the same module-scoped
// handler the runtime's own `consoleError` reads back from - catching errors (a render exception,
// a lifecycle hook throwing, ...) that Stencil's runtime catches internally and would otherwise
// never reach `window.addEventListener('error', ...)`.
const ERROR_REPORTING_SCRIPT = `<script type="module">
import { setErrorHandler } from '@stencil/core/runtime/client/standalone';
window.addEventListener('error', (e) => {
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: false, message: e.message }, '*');
}, true);
window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: false, message: reason instanceof Error ? reason.message : String(reason) }, '*');
});
window.reportModuleError = (e) => {
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: false, message: 'Failed to load the compiled component module.' }, '*');
};
setErrorHandler((e) => {
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: false, message: e instanceof Error ? e.message : String(e) }, '*');
});
</script>`;

// `data:` URLs, not `blob:` - a `blob:` URL is registered against its creating environment, and
// this iframe is a deliberately opaque-origin sandbox (see below), where `import()`ing a
// same-iframe-created `blob:` URL can throw "Failed to fetch dynamically imported module".
// `data:` URLs carry their content inline, with no separate registration/fetch step to fail.
const toDataUrl = (code: string) =>
  `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;

// Every compiled file becomes its own `data:` module, keyed in the import map by its bare
// virtual path (e.g. `my-component.tsx`). Bare-specifier resolution is the only part of the
// import-map spec independent of the referring module's own URL, so cross-file imports resolve
// correctly between otherwise-unrelated modules.
const buildImportMap = (files: CompiledFile[]) => {
  const imports: Record<string, string> = {};
  for (const [specifier, file] of Object.entries(VENDOR_IMPORT_MAP)) {
    // Relative to the shared runtime chunk's own directory (one level under
    // dist/loader-bundle/) - two levels up reaches the sibling dist/vendor/.
    imports[specifier] = getAssetPath(`../../vendor/${file}`);
  }
  const moduleUrls = new Map<string, string>();
  for (const file of files) {
    const url = toDataUrl(file.code);
    moduleUrls.set(file.virtualPath, url);
    imports[file.virtualPath] = url;
  }
  return { imports, moduleUrls };
};

const MODULE_SCRIPT_SRC_RE =
  /(<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi;

// An HTML `src` has no notion of a "bare specifier" the way a JS `import` does - every
// non-absolute value is just a relative URL, `./`-prefixed or not. Resolves it the same way
// `resolveRelativePath` resolves a JS specifier; returns `null` for an absolute URL, left untouched.
const resolveHtmlSrc = (src: string): string | null => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith('/')) return null;
  const relative = src.startsWith('./') || src.startsWith('../') ? src : `./${src}`;
  return resolveRelativePath(relative, INDEX_HTML_NAME);
};

// Rewrites `<script type="module" src="...">` entry points that reference a project file to
// the literal `data:` URL for that file. `src` attributes aren't governed by the import map
// (only specifiers inside `import` statements are), so this can't be a bare-specifier rewrite
// like the one `stencil-playground.tsx` does for `import`s between project files.
const rewriteEntryScripts = (html: string, moduleUrls: Map<string, string>) =>
  html.replace(MODULE_SCRIPT_SRC_RE, (match, pre: string, src: string, post: string) => {
    const resolved = resolveHtmlSrc(src);
    const moduleUrl = resolved && moduleUrls.get(resolved);
    return moduleUrl ? `${pre}${moduleUrl}${post}` : match;
  });

const injectIntoHead = (html: string, injected: string) => {
  const headMatch = /<head[^>]*>/i.exec(html);
  if (headMatch) {
    const end = headMatch.index + headMatch[0].length;
    return html.slice(0, end) + injected + html.slice(end);
  }
  return injected + html;
};

// Unlike `buildAutoMountSrcdoc`, a custom `index.html`'s markup is user-authored - there's no
// fixed tag set to check registration against, so `load` (which waits for every module script to
// finish) stands in as the generic success signal.
const LOAD_SUCCESS_SCRIPT = `<script>
window.addEventListener('load', () => {
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: true }, '*');
});
</script>`;

const buildSrcdocFromIndexHtml = (
  indexHtml: string,
  imports: Record<string, string>,
  moduleUrls: Map<string, string>,
) => {
  const rewritten = rewriteEntryScripts(indexHtml, moduleUrls);
  const head = `<script type="importmap">${JSON.stringify({ imports })}</script>${ERROR_REPORTING_SCRIPT}${LOAD_SUCCESS_SCRIPT}`;
  return injectIntoHead(rewritten, head);
};

// No `index.html` supplied: auto-mount one instance of every `@Component` tag found across
// all compiled files, in file order - the "multi component support without writing an
// index.html" path.
const buildAutoMountSrcdoc = (files: CompiledFile[], imports: Record<string, string>) => {
  const tags = files.flatMap((f) => f.componentTags);
  const importStatements = files
    .filter((f) => f.componentTags.length > 0)
    .map((f) => `await import(${JSON.stringify(f.virtualPath)});`)
    .join('\n');

  return `<!doctype html>
<meta charset="utf-8">
<style>html,body{margin:0;padding:0.75rem;font-family:system-ui,sans-serif;}</style>
<script type="importmap">${JSON.stringify({ imports })}</script>
${ERROR_REPORTING_SCRIPT}
<script type="module" onerror="window.reportModuleError(event)">
try {
${importStatements}
const tags = ${JSON.stringify(tags)};
if (tags.length > 0 && tags.every((t) => customElements.get(t))) {
  tags.forEach((t) => document.body.appendChild(document.createElement(t)));
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: true }, '*');
} else {
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: false, message: 'One or more components failed to register.' }, '*');
}
} catch (e) {
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: false, message: 'Failed to import a compiled module: ' + (e && e.message) }, '*');
}
</script>`;
};

@Component({
  tag: 'stencil-playground-preview',
  styleUrl: 'stencil-playground-preview.css',
  encapsulation: { type: 'shadow' },
})
export class StencilPlaygroundPreview {
  @Prop() input: PreviewInput = { files: [], indexHtml: null };

  @Event() previewResult!: EventEmitter<PreviewResult>;

  private iframe!: HTMLIFrameElement;

  private onMessage = (ev: MessageEvent) => {
    if (ev.source === this.iframe.contentWindow && ev.data?.source === MESSAGE_SOURCE) {
      this.previewResult.emit({ ok: ev.data.ok, message: ev.data.message });
    }
  };

  @Watch('input')
  update() {
    const { files, indexHtml } = this.input;
    if (files.length === 0) return;

    const { imports, moduleUrls } = buildImportMap(files);

    this.iframe.srcdoc = indexHtml
      ? buildSrcdocFromIndexHtml(indexHtml, imports, moduleUrls)
      : buildAutoMountSrcdoc(files, imports);
  }

  connectedCallback() {
    window.addEventListener('message', this.onMessage);
  }

  disconnectedCallback() {
    window.removeEventListener('message', this.onMessage);
  }

  componentDidLoad() {
    this.update();
  }

  render() {
    return (
      <iframe ref={(el) => (this.iframe = el!)} sandbox='allow-scripts' title='Component preview' />
    );
  }
}

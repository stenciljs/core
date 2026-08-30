import { Component, Event, getAssetPath, Prop, Watch } from '@stencil/core';
import type { EventEmitter } from '@stencil/core';

const MESSAGE_SOURCE = 'stencil-playground-preview';

export interface PreviewResult {
  ok: boolean;
  message?: string;
}

const VENDOR_IMPORT_MAP = {
  '@stencil/core/runtime/client/standalone': 'runtime-client-standalone.js',
  '@stencil/core/app-data': 'app-data.js',
  '@stencil/core/app-globals': 'app-globals.js',
  '@preact/signals-core': 'signals-core.js',
};

// Neutralizes `</script>` sequences that would otherwise break out of the
// <script> tag they get embedded in - standard practice for inlining
// arbitrary code/data into HTML (same technique SSR frameworks use).
const escapeForInlineScript = (code: string) => code.replace(/<\/script/gi, '<\\/script');

const buildSrcdoc = (compiledCode: string, tagName: string) => {
  const importMap = {
    imports: Object.fromEntries(
      Object.entries(VENDOR_IMPORT_MAP).map(([specifier, file]) => [
        specifier,
        // getAssetPath resolves relative to the shared runtime chunk's own
        // directory, which lives one level under dist/loader-bundle/ - two
        // levels up reaches the sibling dist/vendor/ directory.
        getAssetPath(`../../vendor/${file}`),
      ]),
    ),
  };

  // Loaded as an inline module script, not Blob + dynamic import() - an
  // opaque-origin sandboxed iframe (no allow-same-origin, deliberately) can
  // fail to fetch a blob: URL it created itself for a module import, a real
  // browser quirk around opaque origins and blob URL fetches.
  return `<!doctype html>
<meta charset="utf-8">
<style>html,body{margin:0;padding:0.75rem;font-family:system-ui,sans-serif;}</style>
<script type="importmap">${JSON.stringify(importMap)}</script>
<script>
window.addEventListener('error', (e) => {
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: false, message: e.message }, '*');
}, true);
window.reportModuleError = (e) => {
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: false, message: 'Failed to load the compiled component module.' }, '*');
};
</script>
<script type="module" onerror="window.reportModuleError(event)">
${escapeForInlineScript(compiledCode)}
</script>
<script type="module">
const tagName = ${JSON.stringify(tagName)};
if (customElements.get(tagName)) {
  document.body.appendChild(document.createElement(tagName));
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: true }, '*');
} else {
  parent.postMessage({ source: ${JSON.stringify(MESSAGE_SOURCE)}, ok: false, message: 'Component failed to register.' }, '*');
}
</script>`;
};

@Component({
  tag: 'stencil-playground-preview',
  styleUrl: 'stencil-playground-preview.css',
  encapsulation: { type: 'shadow' },
})
export class StencilPlaygroundPreview {
  @Prop() compiledCode: string | null = null;
  @Prop() componentTag: string | null = null;

  @Event() previewResult!: EventEmitter<PreviewResult>;

  private iframe!: HTMLIFrameElement;

  private onMessage = (ev: MessageEvent) => {
    if (ev.source === this.iframe.contentWindow && ev.data?.source === MESSAGE_SOURCE) {
      this.previewResult.emit({ ok: ev.data.ok, message: ev.data.message });
    }
  };

  @Watch('compiledCode')
  @Watch('componentTag')
  update() {
    if (this.compiledCode && this.componentTag) {
      this.iframe.srcdoc = buildSrcdoc(this.compiledCode, this.componentTag);
    }
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

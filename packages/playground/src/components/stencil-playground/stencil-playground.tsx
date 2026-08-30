import { Component, Element, Prop, State } from '@stencil/core';
import type { Diagnostic, TranspileOptions } from '@stencil/core/compiler/browser';

const DEFAULT_CODE = `import { Component, h } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`;

const TAG_NAME_RE = /@Component\s*\(\s*\{[^}]*\btag\s*:\s*['"]([^'"]+)['"]/;

const COMPILE_OPTIONS: Omit<TranspileOptions, 'sys'> = {
  file: '/src/my-component.tsx',
  componentExport: 'customelement',
  styleImportData: 'queryparams',
  // defaults to true; pulls in ts.createCompilerHost() for nothing when
  // there's no tsconfig `paths`, which is always true here.
  transformAliasedImportPaths: false,
};
let compilerPromise: Promise<typeof import('@stencil/core/compiler/browser')> | undefined;
const loadCompiler = () => (compilerPromise ??= import('@stencil/core/compiler/browser'));

@Component({
  tag: 'stencil-playground',
  styleUrl: 'stencil-playground.css',
  encapsulation: { type: 'shadow' },
})
export class StencilPlayground {
  @Element() el!: HTMLElement;

  @Prop() code = DEFAULT_CODE;

  @State() source = this.code;
  @State() compiledCode: string | null = null;
  @State() componentTag: string | null = null;
  @State() diagnostics: Diagnostic[] = [];

  private debounceTimer?: ReturnType<typeof setTimeout>;
  private intersectionObserver?: IntersectionObserver;

  componentDidLoad() {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        this.intersectionObserver?.disconnect();
        this.compile();
      }
    });
    this.intersectionObserver.observe(this.el);
  }

  disconnectedCallback() {
    this.intersectionObserver?.disconnect();
    clearTimeout(this.debounceTimer);
  }

  private onValueChange = (ev: CustomEvent<string>) => {
    this.source = ev.detail;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.compile(), 500);
  };

  private async compile() {
    const source = this.source;
    const { transpileSync, createSystem } = await loadCompiler();

    const result = transpileSync(source, { ...COMPILE_OPTIONS, sys: createSystem() });

    if (source !== this.source) {
      return; // a newer edit landed while this compile was in flight
    }

    this.diagnostics = result.diagnostics;
    if (result.diagnostics.length === 0) {
      this.compiledCode = result.code;
      this.componentTag = TAG_NAME_RE.exec(source)?.[1] ?? null;
    }
  }

  render() {
    return (
      <div class='layout'>
        <stencil-playground-editor value={this.source} onValueChange={this.onValueChange} />
        <stencil-playground-preview
          compiledCode={this.compiledCode}
          componentTag={this.componentTag}
        />
        {this.diagnostics.length > 0 && (
          <div class='diagnostics'>
            {this.diagnostics.map((d) => (
              <div>{d.messageText}</div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

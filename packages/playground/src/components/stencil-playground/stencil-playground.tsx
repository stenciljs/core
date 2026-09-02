import { Component, Element, Prop, State, Watch } from '@stencil/core';
import type { CompilerSystem, Diagnostic, TranspileOptions } from '@stencil/core/compiler/browser';

import {
  buildIntrinsicElementsDts,
  findComponentTags,
  findInjectedStyleImports,
  replaceSpecifier,
  resolveProjectImport,
  type CompiledFile,
  type PlaygroundFile,
} from '../../utils';
import type { EditorFilesState } from '../stencil-playground-editor/stencil-playground-editor';
import type {
  PreviewInput,
  PreviewResult,
} from '../stencil-playground-preview/stencil-playground-preview';

const INDEX_HTML_NAME = 'index.html';
const CONFIG_FILE_NAME = 'stencil.config.ts';

const DEFAULT_FILES: PlaygroundFile[] = [
  {
    name: 'my-component.tsx',
    content: `import { Component } from '@stencil/core';

@Component({ tag: 'my-component' })
export class MyComponent {
  render() {
    return <div>Hello from Stencil!</div>;
  }
}
`,
  },
];

const BASE_COMPILE_OPTIONS: Omit<TranspileOptions, 'sys' | 'file' | 'jsx'> = {
  componentExport: 'customelement',
  styleImportData: 'queryparams',
  target: 'es2022',
  // Skips ts.createCompilerHost() - only needed for tsconfig `paths`, which we never have.
  transformAliasedImportPaths: false,
  jsxImportSource: '@stencil/core',
};
let compilerPromise: Promise<typeof import('@stencil/core/compiler/browser')> | undefined;
const loadCompiler = () => (compilerPromise ??= import('@stencil/core/compiler/browser'));

/** The subset of `Config` that has meaning for an in-browser transpile + preview - everything
 * else (output targets, plugins, ...) has no equivalent here. */
interface PlaygroundConfig {
  tsCompilerOptions?: {
    jsx?: number;
    jsxImportSource?: string;
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
  signalBacking?: boolean;
}

@Component({
  tag: 'stencil-playground',
  styleUrl: 'stencil-playground.css',
  encapsulation: { type: 'shadow' },
})
export class StencilPlayground {
  @Element() el!: HTMLElement;

  /** The list of files in the playground. */
  @Prop({ mutable: true }) files: PlaygroundFile[] = DEFAULT_FILES;

  @State() activeFileName: string = this.files[0]?.name ?? '';
  // Bundled so the editor never sees one update without the other - see `EditorFilesState`.
  @State() editorFilesState: EditorFilesState = {
    files: this.files,
    activeFileName: this.activeFileName,
  };
  // Bundled so the preview never sees one update without the other - see `PreviewInput`.
  @State() previewInput: PreviewInput = {
    files: [],
    indexHtml: null,
    vdomSignals: false,
    signalBacking: false,
  };
  @State() diagnostics: Diagnostic[] = [];
  @State() previewError: string | null = null;
  // JSX `IntrinsicElements` augmentation for every component defined across the project's own
  // files, so Monaco recognizes e.g. `<my-component>` as a valid tag - see buildIntrinsicElementsDts.
  @State() jsxTypesDts = '';

  private debounceTimer?: ReturnType<typeof setTimeout>;
  private intersectionObserver?: IntersectionObserver;
  // Guards against two concurrent compile() calls racing the preview's srcdoc update.
  private compileToken = 0;
  // Distinguishes onFileChange's own `files` reassignment from an external one in the @Watch below.
  private suppressFilesWatch = false;

  // Re-derives `activeFileName` in case `files` was set pre-upgrade (e.g. right after
  // `document.createElement`), which runs before the field initializers above. Doesn't call
  // compile() itself - that stays gated behind the IntersectionObserver below.
  componentWillLoad() {
    if (!this.files.some((f) => f.name === this.activeFileName)) {
      this.activeFileName = this.files[0]?.name ?? '';
    }
    this.syncEditorFilesState();
  }

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

  private syncEditorFilesState() {
    this.editorFilesState = { files: this.files, activeFileName: this.activeFileName };
  }

  private onFileChange = (ev: CustomEvent<{ name: string; content: string }>) => {
    const { name, content } = ev.detail;
    this.suppressFilesWatch = true;
    this.files = this.files.map((f) => (f.name === name ? { ...f, content } : f));
    this.syncEditorFilesState();
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.compile(), 500);
  };

  private onActiveFileChange = (ev: CustomEvent<string>) => {
    this.activeFileName = ev.detail;
    this.syncEditorFilesState();
  };

  // Covers a caller setting `.files` on an already-connected element. Not `{ immediate: true }` -
  // that would fire for every playground on page load, defeating the IntersectionObserver gate
  // below (`componentWillLoad` covers the pre-upgrade case instead).
  @Watch('files')
  onFilesPropChange(files: PlaygroundFile[]) {
    if (this.suppressFilesWatch) {
      this.suppressFilesWatch = false;
      return;
    }
    if (!files.some((f) => f.name === this.activeFileName)) {
      this.activeFileName = files[0]?.name ?? '';
    }
    this.syncEditorFilesState();
    clearTimeout(this.debounceTimer);
    this.compile();
  }

  // Compile diagnostics only catch compile-time errors - things like an unresolved specifier
  // the vendor import map doesn't know about only surface once the code runs in the iframe.
  private onPreviewResult = (ev: CustomEvent<PreviewResult>) => {
    this.previewError = ev.detail.ok ? null : (ev.detail.message ?? 'The preview failed to load.');
  };

  // Transpiles `stencil.config.ts` and executes the compiled module to read its exported
  // `config`, rather than re-parsing it as a subset.
  private async loadConfigOverrides(
    configFile: PlaygroundFile,
    sys: CompilerSystem,
    transpileSync: typeof import('@stencil/core/compiler/browser').transpileSync,
  ): Promise<{
    overrides: Partial<TranspileOptions>;
    signalBacking: boolean;
    diagnostics: Diagnostic[];
  }> {
    // Omits `buildOverrides`: it makes the compiler prepend an `@stencil/core/app-data` import,
    // which can't resolve here - this module runs in the page's own module graph, not the
    // import-mapped sandboxed iframe.
    const { buildOverrides: _buildOverrides, ...configCompileOptions } = BASE_COMPILE_OPTIONS;
    const result = transpileSync(configFile.content, {
      ...configCompileOptions,
      sys,
      file: `/${CONFIG_FILE_NAME}`,
    });
    if (result.diagnostics.length > 0) {
      return { overrides: {}, signalBacking: false, diagnostics: result.diagnostics };
    }

    const url = URL.createObjectURL(new Blob([result.code], { type: 'text/javascript' }));
    try {
      const mod: { config?: PlaygroundConfig } = await import(url);
      const ts = mod.config?.tsCompilerOptions;
      const overrides: Partial<TranspileOptions> = {};
      if (ts?.jsx != null) overrides.jsx = ts.jsx;
      if (ts?.jsxImportSource) overrides.jsxImportSource = ts.jsxImportSource;
      if (ts?.baseUrl) overrides.baseUrl = ts.baseUrl;
      if (ts?.paths) overrides.paths = ts.paths;
      return { overrides, signalBacking: !!mod.config?.signalBacking, diagnostics: [] };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private async compile() {
    const token = ++this.compileToken;
    const filesSnapshot = this.files;
    const sourceFiles = filesSnapshot.filter(
      (f) => f.name !== INDEX_HTML_NAME && f.name !== CONFIG_FILE_NAME,
    );
    const indexHtmlFile = filesSnapshot.find((f) => f.name === INDEX_HTML_NAME);
    const configFile = filesSnapshot.find((f) => f.name === CONFIG_FILE_NAME);

    const { transpileSync, createSystem, generateComponentTypes, ts } = await loadCompiler();
    if (token !== this.compileToken) return; // a newer compile() call started while loading

    const sys = createSystem();
    const knownPaths = new Set(sourceFiles.map((f) => f.name));

    // Without this, `extends Foo`/`Mixin(...)` heritage falls back to the compiler's real
    // TS-module-resolution path, which depends on `ts.sys` - a no-op in a browser bundle, so it
    // throws instead of resolving.
    const resolveImport: TranspileOptions['resolveImport'] = (specifier, importer) => {
      const target = resolveProjectImport(specifier, importer.replace(/^\//, ''), knownPaths);
      const file = target && sourceFiles.find((f) => f.name === target.split('?')[0]);
      return file ? { code: file.content, path: `/${file.name}` } : null;
    };

    // Automatic JSX runtime - lets user snippets skip `import { h } from '@stencil/core';`,
    // matching how components are actually authored in a real Stencil project.
    let compileOptions: Omit<TranspileOptions, 'sys' | 'file'> = {
      ...BASE_COMPILE_OPTIONS,
      jsx: ts.JsxEmit.ReactJSX,
      resolveImport,
    };
    const diagnostics: Diagnostic[] = [];
    let signalBacking = false;
    if (configFile) {
      const config = await this.loadConfigOverrides(configFile, sys, transpileSync);
      if (token !== this.compileToken) return;
      compileOptions = { ...compileOptions, ...config.overrides };
      signalBacking = config.signalBacking;
      diagnostics.push(...config.diagnostics);
    }

    // `sys` needs real absolute-style paths for cross-file `extends` resolution, but the bare
    // `name` (no leading slash) is what's used as the import-map virtual path below - it has to
    // stay bare so it resolves the same way regardless of which data: URL is doing the importing.
    for (const f of sourceFiles) {
      sys.writeFileSync(`/${f.name}`, f.content);
    }

    const compiled: CompiledFile[] = [];
    const cssRequests = new Map<string, string>(); // virtualPath (+query) -> source file name
    const componentMetas: Parameters<typeof generateComponentTypes>[0][] = [];
    // Mirrors the real compiler's `hasSignalsImport` build feature: importing the signals module
    // always turns on the vdom's signal-unwrapping support, whether or not `signalBacking` is set.
    let hasSignalsImport = false;

    for (const f of sourceFiles) {
      if (!/\.tsx?$/.test(f.name)) continue;
      const result = transpileSync(f.content, { ...compileOptions, sys, file: `/${f.name}` });
      diagnostics.push(...result.diagnostics);
      if (result.diagnostics.length > 0) continue;
      componentMetas.push(...(result.data ?? []));

      let code = result.code;
      // `result.imports` only reflects imports already present in the original source - a
      // `styleUrl` component's style import is injected straight into the compiled output by a
      // later transform stage, so it has to be found separately (see findInjectedStyleImports).
      const specifiers = [
        ...(result.imports ?? []).map((imp) => imp.path),
        ...findInjectedStyleImports(result.code),
      ];
      if (specifiers.includes('@stencil/core/signals')) {
        hasSignalsImport = true;
      }
      for (const specifier of specifiers) {
        const target = resolveProjectImport(specifier, f.name, knownPaths);
        if (!target) continue;
        code = replaceSpecifier(code, specifier, target);
        if (target.split('?')[0].endsWith('.css')) {
          cssRequests.set(target, target.split('?')[0]);
        }
      }
      // matched against the original source, not `code` - the decorator-to-static transform
      // strips the literal `@Component({ tag: ... })` syntax out of the compiled output.
      compiled.push({ virtualPath: f.name, code, componentTags: findComponentTags(f.content) });
    }

    for (const [virtualPath, sourceName] of cssRequests) {
      const cssFile = sourceFiles.find((f) => f.name === sourceName);
      if (!cssFile) continue;
      const result = transpileSync(cssFile.content, { ...compileOptions, sys, file: virtualPath });
      diagnostics.push(...result.diagnostics);
      if (result.diagnostics.length > 0) continue;
      compiled.push({ virtualPath, code: result.code, componentTags: [] });
    }

    if (token !== this.compileToken) return;
    this.diagnostics = diagnostics;
    if (diagnostics.length === 0) {
      this.previewInput = {
        files: compiled,
        indexHtml: indexHtmlFile?.content ?? null,
        vdomSignals: hasSignalsImport || signalBacking,
        signalBacking,
      };
    }
    this.jsxTypesDts = buildIntrinsicElementsDts(
      componentMetas.map((cmp) => generateComponentTypes(cmp, {}, false)),
    );
  }

  render() {
    return (
      <div class='layout'>
        <stencil-playground-editor
          filesState={this.editorFilesState}
          diagnostics={this.diagnostics}
          jsxTypesDts={this.jsxTypesDts}
          onFileChange={this.onFileChange}
          onActiveFileChange={this.onActiveFileChange}
        />
        <stencil-playground-preview
          input={this.previewInput}
          onPreviewResult={this.onPreviewResult}
        />
        {this.diagnostics.length > 0 && (
          <div class='diagnostics'>
            {this.diagnostics.map((d) => (
              <div>
                {d.absFilePath ? `${d.absFilePath}: ` : ''}
                {d.messageText}
              </div>
            ))}
          </div>
        )}
        {this.previewError && <div class='preview-error'>{this.previewError}</div>}
      </div>
    );
  }
}

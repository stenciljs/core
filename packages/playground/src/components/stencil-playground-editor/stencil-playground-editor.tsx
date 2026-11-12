import {
  Component,
  Element,
  Event,
  getShadowRoot,
  Prop,
  registerSideEffectStyleTarget,
  State,
  unregisterSideEffectStyleTarget,
  Watch,
} from '@stencil/core';
import type { EventEmitter } from '@stencil/core';
import type { Diagnostic } from '@stencil/core/compiler/browser';
import type {
  editor as MonacoEditorNS,
  IDisposable,
  MarkerSeverity,
} from 'monaco-editor/editor/editor.api.js';

import type { PlaygroundEditorTheme, PlaygroundFile } from '../../utils';

export interface EditorFilesState {
  files: PlaygroundFile[];
  activeFileName: string;
}

// See `monaco-setup.ts` for why Monaco is one lazy-loaded module rather than several parallel
// dynamic imports.
let monacoModulePromise: Promise<typeof import('../../monaco-setup')> | undefined;
const loadMonaco = () => (monacoModulePromise ??= import('../../monaco-setup'));

const CUSTOM_THEME_NAME = 'stencil-playground-custom';

// typescriptDefaults is a page-wide singleton (one TS service for every instance) - configure once.
let typescriptDefaultsConfigured = false;

const configureTypescriptDefaults = (monacoModule: typeof import('../../monaco-setup')) => {
  if (typescriptDefaultsConfigured) return;
  typescriptDefaultsConfigured = true;
  const {
    typescriptDefaults,
    ScriptTarget,
    JsxEmit,
    ModuleResolutionKind,
    stencilCoreDts,
    stencilCoreCompilerDts,
    stencilCoreJsxRuntimeDts,
    stencilCoreSignalsDts,
    preactSignalsCoreDts,
  } = monacoModule;

  // Mirrors BASE_COMPILE_OPTIONS/transpile-options.ts's tsCompilerOptions (minus the
  // isolated-single-file-only flags like noLib/noResolve, which would defeat the point of a real
  // language service).
  typescriptDefaults.setCompilerOptions({
    allowNonTsExtensions: true,
    target: ScriptTarget.ESNext,
    jsx: JsxEmit.ReactJSX,
    jsxImportSource: '@stencil/core',
    moduleResolution: ModuleResolutionKind.NodeJs,
    experimentalDecorators: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    skipLibCheck: true,
  });
  // Syncs every TS model when the worker starts - see syncWorkerModels for the models created after.
  typescriptDefaults.setEagerModelSync(true);

  // Virtual paths matching what TS's classic Node resolution looks for, and what these files'
  // own relative imports expect (jsx-runtime.d.ts -> stencil-public-runtime.d.ts,
  // stencil-public-compiler.d.ts -> stencil-public-runtime.d.ts).
  const lib = (path: string, content: string) =>
    typescriptDefaults.addExtraLib(content, `file:///node_modules/${path}`);

  // Mirrors the real package's index.d.mts: runtime symbols re-exported wholesale, plus `Config`/
  // `PrerenderConfig` pulled in from the compiler declarations - so a `stencil.config.ts` snippet's
  // `import type { Config } from '@stencil/core'` resolves like it would in a real project.
  lib(
    '@stencil/core/index.d.ts',
    `${stencilCoreDts}\nexport type { StencilConfig as Config, PrerenderConfig } from './declarations/stencil-public-compiler.js';\n`,
  );
  lib('@stencil/core/declarations/stencil-public-runtime.d.ts', stencilCoreDts);
  lib('@stencil/core/declarations/stencil-public-compiler.d.ts', stencilCoreCompilerDts);
  lib('@stencil/core/jsx-runtime.d.ts', stencilCoreJsxRuntimeDts);
  lib('@stencil/core/signals/index.d.ts', stencilCoreSignalsDts);
  lib('@preact/signals-core/index.d.ts', preactSignalsCoreDts);
};

interface HoverController extends MonacoEditorNS.IEditorContribution {
  _onEditorMouseLeave: (e: unknown) => void;
}

// Workaround for microsoft/monaco-editor#3409: mouse handler checks `viewDomNode.contains(e.target)`
// on a *document*-level - but shadow DOM retargets `e.target` to the shadow
// host for listeners outside the tree, so `.contains()` always returns false permanently cancelling hover
// before its delay elapses. Filters the spurious leave events using real client coordinates (unaffected by
// retargeting, unlike `.target`) before they reach Monaco's own handler.
const patchHoverLeaveDetection = (controller: HoverController | null, container: HTMLElement) => {
  if (!controller) return;
  const original = controller._onEditorMouseLeave.bind(controller);
  controller._onEditorMouseLeave = (e) => {
    const browserEvent = (e as { event?: { browserEvent?: MouseEvent } })?.event?.browserEvent;
    if (browserEvent) {
      const rect = container.getBoundingClientRect();
      const stillInside =
        browserEvent.clientX >= rect.left &&
        browserEvent.clientX <= rect.right &&
        browserEvent.clientY >= rect.top &&
        browserEvent.clientY <= rect.bottom;
      if (stillInside) return;
    }
    original(e);
  };
};

// Monaco's model service is a page-wide singleton keyed by URI - two editor instances with a
// same-named file would otherwise collide. Prefixing with a per-instance id keeps them separate.
let nextInstanceId = 0;

const languageForFile = (name: string): string => {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return 'typescript';
  if (name.endsWith('.css')) return 'css';
  if (name.endsWith('.html')) return 'html';
  return 'plaintext';
};

const severityFor = (
  level: Diagnostic['level'],
  monaco: typeof import('monaco-editor/editor/editor.api.js'),
): MarkerSeverity => {
  switch (level) {
    case 'error':
      return monaco.MarkerSeverity.Error;
    case 'warn':
      return monaco.MarkerSeverity.Warning;
    case 'info':
      return monaco.MarkerSeverity.Info;
    default:
      return monaco.MarkerSeverity.Hint;
  }
};

// The matching entry in `d.lines` (context lines around the error - only the actual error line
// has a real `errorLength`, others are the sentinel -1) gives how much of the line to underline.
const diagnosticToMarker = (
  d: Diagnostic,
  monaco: typeof import('monaco-editor/editor/editor.api.js'),
): MonacoEditorNS.IMarkerData => {
  const lineNumber = d.lineNumber ?? 1;
  const startColumn = d.columnNumber ?? 1;
  const line = d.lines.find((l) => l.lineNumber === lineNumber);
  const length = line && line.errorLength && line.errorLength > 0 ? line.errorLength : 1;
  return {
    severity: severityFor(d.level, monaco),
    message: d.messageText,
    startLineNumber: lineNumber,
    startColumn,
    endLineNumber: lineNumber,
    endColumn: startColumn + length,
  };
};

// `getShadowRoot(el)` first, not `el.getRootNode()`: the latter walks *up* from `el` to whatever
// root it lives inside, not `el`'s own shadow root underneath it - which is where this
// component's rendered content (the monaco-editor DOM) actually lives, and needs the styles.
// `getRootNode()` is only the right fallback for `scoped`/`none` encapsulation, which has no
// shadow root of its own.
const getStyleTargetRoot = (el: HTMLElement): DocumentOrShadowRoot => {
  const shadowRoot = getShadowRoot(el);
  if (shadowRoot) return shadowRoot;
  const root = el.getRootNode();
  return root instanceof Document || root instanceof ShadowRoot ? root : document;
};

@Component({
  tag: 'stencil-playground-editor',
  styleUrl: 'stencil-playground-editor.css',
  encapsulation: { type: 'shadow' },
})
export class StencilPlaygroundEditor {
  @Element() el!: HTMLElement;

  /* Editor files state */
  @Prop() filesState: EditorFilesState = { files: [], activeFileName: '' };
  /* Editor diagnostics */
  @Prop() diagnostics: Diagnostic[] = [];
  /* JSX IntrinsicElements types for components defined in the project - see buildIntrinsicElementsDts */
  @Prop() jsxTypesDts = '';

  /** See `stencil-playground`'s `editorTheme`. */
  @Prop() theme?: PlaygroundEditorTheme;

  /* Fired when the file content changes */
  @Event() fileChange!: EventEmitter<{ name: string; content: string }>;
  /* Fired when the active file changes */
  @Event() activeFileChange!: EventEmitter<string>;
  // Fires once Monaco's loaded and models/markers are in sync - lets a caller wait for the editor
  // to actually be ready instead of guessing at a timeout.
  @Event() editorReady!: EventEmitter<void>;

  @State() monacoLoaded = false;

  private instanceId = nextInstanceId++;
  private container?: HTMLDivElement;
  private tabs?: HTMLDivElement;
  private monaco?: typeof import('monaco-editor/editor/editor.api.js');
  private typescriptDefaults?: typeof import('../../monaco-setup').typescriptDefaults;
  private getTypeScriptWorker?: typeof import('../../monaco-setup').getTypeScriptWorker;
  private editor?: MonacoEditorNS.IStandaloneCodeEditor;
  private models = new Map<string, MonacoEditorNS.ITextModel>();
  private modelListeners = new Map<string, IDisposable>();

  private onTabClick = (name: string) => {
    this.activeFileChange.emit(name);
  };

  private syncModels(files: PlaygroundFile[]) {
    const monaco = this.monaco!;
    const names = new Set(files.map((f) => f.name));

    for (const [name, model] of this.models) {
      if (!names.has(name)) {
        this.modelListeners.get(name)?.dispose();
        this.modelListeners.delete(name);
        model.dispose();
        this.models.delete(name);
      }
    }

    for (const file of files) {
      const existing = this.models.get(file.name);
      if (existing) {
        // Skip when unchanged - otherwise this echoes our own fileChange back into the model
        // and stomps the user's cursor/undo stack mid-edit.
        if (existing.getValue() !== file.content) {
          existing.setValue(file.content);
        }
        continue;
      }
      const uri = monaco.Uri.parse(`file:///${this.instanceId}/${file.name}`);
      const model = monaco.editor.createModel(file.content, languageForFile(file.name), uri);
      this.models.set(file.name, model);
      this.modelListeners.set(
        file.name,
        model.onDidChangeContent(() => {
          this.fileChange.emit({ name: file.name, content: model.getValue() });
        }),
      );
    }
    this.syncWorkerModels();
  }

  // Monaco's TS worker only mirrors the models a request names (by default, just the one open in
  // the editor), so an import of a file whose tab was never opened reports "Cannot find module".
  // Naming every TS/JS model once syncs them all, and the worker keeps them in sync from then on.
  // This rejects until Monaco has set up its TS mode - eager model sync (configureTypescriptDefaults)
  // covers the models that exist by the time the worker starts; this covers the ones created later.
  private async syncWorkerModels() {
    const uris = [...this.models.values()]
      .filter((m) => m.getLanguageId() === 'typescript' || m.getLanguageId() === 'javascript')
      .map((m) => m.uri);
    if (!this.getTypeScriptWorker || uris.length === 0) return;
    try {
      const getWorker = await this.getTypeScriptWorker();
      await getWorker(...uris);
    } catch {
      // Language service unavailable - imports between files just keep their squiggles.
    }
  }

  private showActiveModel() {
    const model = this.models.get(this.filesState.activeFileName);
    if (model) this.editor?.setModel(model);
  }

  // Every model gets its markers set on every call, including an empty array for files with no
  // diagnostics - otherwise a squiggle from a since-fixed error would stick around forever.
  private updateMarkers() {
    const monaco = this.monaco;
    if (!monaco) return;
    const byFile = new Map<string, MonacoEditorNS.IMarkerData[]>();
    for (const d of this.diagnostics) {
      const fileName = d.absFilePath?.replace(/^\//, '');
      if (!fileName) continue;
      const markers = byFile.get(fileName) ?? [];
      markers.push(diagnosticToMarker(d, monaco));
      byFile.set(fileName, markers);
    }
    for (const [name, model] of this.models) {
      monaco.editor.setModelMarkers(model, 'stencil', byFile.get(name) ?? []);
    }
  }

  @Watch('filesState')
  onFilesStateChange(filesState: EditorFilesState) {
    if (!this.monaco) return;
    this.syncModels(filesState.files);
    this.showActiveModel();
    this.updateMarkers();
    this.editorReady.emit();
  }

  @Watch('diagnostics')
  onDiagnosticsChange() {
    this.updateMarkers();
  }

  // addExtraLib is keyed by path - calling it again with the same path replaces the content.
  private updateJsxTypes() {
    this.typescriptDefaults?.addExtraLib(this.jsxTypesDts, 'file:///component-types.d.ts');
  }

  private applyTheme() {
    if (!this.monaco) return;
    if (this.theme) {
      this.monaco.editor.defineTheme(
        CUSTOM_THEME_NAME,
        this.theme as MonacoEditorNS.IStandaloneThemeData,
      );
    }
    this.monaco.editor.setTheme(this.theme ? CUSTOM_THEME_NAME : 'vs-dark');
  }

  @Watch('theme')
  onThemeChange() {
    this.applyTheme();
  }

  @Watch('jsxTypesDts')
  onJsxTypesDtsChange() {
    this.updateJsxTypes();
  }

  private connected = false;

  connectedCallback() {
    this.connected = true;
    // Registers this component's shadow root to receive monaco-editor's plain CSS.
    registerSideEffectStyleTarget(getStyleTargetRoot(this.el));
  }

  async componentDidLoad() {
    const monacoModule = await loadMonaco();
    // `loadMonaco()` is always at least one microtask away, so this component can be
    // disconnected again before it resolves (e.g. a test mounting and immediately removing an
    // element). Without this check the editor/models would still get created for a detached
    // element and leak for the page's lifetime.
    if (!this.connected) return;
    configureTypescriptDefaults(monacoModule);
    this.monaco = monacoModule.monaco;
    this.typescriptDefaults = monacoModule.typescriptDefaults;
    this.getTypeScriptWorker = monacoModule.getTypeScriptWorker;
    this.monacoLoaded = true;
    const hostStyle = getComputedStyle(this.el);
    const cssValue = (name: string) => hostStyle.getPropertyValue(name).trim();
    this.editor = this.monaco.editor.create(this.container!, {
      automaticLayout: true,
      minimap: { enabled: false },
      // Typography from the host's custom properties (they inherit through the shadow root) -
      // Monaco takes these as options, not CSS.
      fontFamily: cssValue('--stencil-playground-editor-font-family') || undefined,
      fontSize: parseFloat(cssValue('--stencil-playground-editor-font-size')) || 13,
      lineHeight: parseFloat(cssValue('--stencil-playground-editor-line-height')) || 0,
      padding: {
        top: parseFloat(cssValue('--stencil-playground-editor-padding')) || 0,
        bottom: parseFloat(cssValue('--stencil-playground-editor-padding')) || 0,
      },
      tabSize: 2,
      theme: 'vs-dark',
      // Positions popups (hover, suggestions) with `position: fixed`, so the host's
      // `overflow: clip` (for its rounded corners) doesn't cut them off at the edges.
      fixedOverflowWidgets: true,
      // the cursor's mark in the overview ruler means nothing in a snippet a few lines long
      hideCursorInOverviewRuler: true,
      // Off so the content height (see updateContentHeight) is just the code - with it on, Monaco
      // pads the content by a viewport's height, which would grow an auto-sized editor forever.
      scrollBeyondLastLine: false,
      // Lets the page scroll on past an editor that has nothing (left) to scroll itself.
      scrollbar: { alwaysConsumeMouseWheel: false },
    });
    this.applyTheme();
    // A web font (e.g. via --stencil-playground-editor-font-family) may still be loading - Monaco
    // measures glyph widths once, so measure again when it arrives.
    document.fonts?.ready.then(() => this.monaco?.editor.remeasureFonts());
    this.editor.onDidContentSizeChange(() => this.updateContentHeight());
    // Monaco registers the hover contribution with `BeforeFirstInteraction` (lazy) instantiation,
    // which never actually fires here - forcing it via getContribution() (same effect as Monaco's
    // own lazy-init path) is what makes mouse-hover/keybindings work at all.
    const hoverController = this.editor.getContribution<HoverController>(
      'editor.contrib.contentHover',
    );
    patchHoverLeaveDetection(hoverController, this.container!);
    this.syncModels(this.filesState.files);
    this.showActiveModel();
    this.updateMarkers();
    this.updateJsxTypes();
    this.updateContentHeight();
    this.editorReady.emit();
  }

  // The height that fits the active file without scrolling, tabs included - read by
  // stencil-playground.css to size the editor in the stacked layout.
  private updateContentHeight() {
    if (!this.editor) return;
    const height = (this.tabs?.offsetHeight ?? 0) + this.editor.getContentHeight();
    this.el.style.setProperty('--_stencil-playground-editor-content-height', `${height}px`);
  }

  disconnectedCallback() {
    this.connected = false;
    unregisterSideEffectStyleTarget(getStyleTargetRoot(this.el));
    this.modelListeners.forEach((d) => d.dispose());
    this.models.forEach((m) => m.dispose());
    this.editor?.dispose();
  }

  render() {
    return (
      <div class='layout'>
        <div class='tabs' role='tablist' ref={(el) => (this.tabs = el)}>
          {this.filesState.files.map((f) => (
            <button
              type='button'
              role='tab'
              class={{ tab: true, active: f.name === this.filesState.activeFileName }}
              aria-selected={f.name === this.filesState.activeFileName ? 'true' : 'false'}
              onClick={() => this.onTabClick(f.name)}
            >
              {f.name}
            </button>
          ))}
        </div>
        {!this.monacoLoaded && <div class='loading'>Loading editor…</div>}
        <div class='editor' ref={(el) => (this.container = el)} />
      </div>
    );
  }
}

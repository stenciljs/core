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

import type { PlaygroundFile } from '../../utils';

export interface EditorFilesState {
  files: PlaygroundFile[];
  activeFileName: string;
}

// See `monaco-setup.ts` for why Monaco is one lazy-loaded module rather than several parallel
// dynamic imports.
let monacoModulePromise: Promise<typeof import('../../monaco-setup')> | undefined;
const loadMonaco = () => (monacoModulePromise ??= import('../../monaco-setup'));

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
  private monaco?: typeof import('monaco-editor/editor/editor.api.js');
  private typescriptDefaults?: typeof import('../../monaco-setup').typescriptDefaults;
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
    this.monacoLoaded = true;
    this.editor = this.monaco.editor.create(this.container!, {
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      tabSize: 2,
      theme: 'vs-dark',
    });
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
    this.editorReady.emit();
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
        <div class='tabs' role='tablist'>
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

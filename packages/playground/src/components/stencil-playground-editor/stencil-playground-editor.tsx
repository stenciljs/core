import {
  Component,
  Element,
  Event,
  getShadowRoot,
  Prop,
  registerGlobalStyleTarget,
  State,
  unregisterGlobalStyleTarget,
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
let monacoPromise: Promise<typeof import('../../monaco-setup').monaco> | undefined;
const loadMonaco = () => (monacoPromise ??= import('../../monaco-setup').then((m) => m.monaco));

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

  private connected = false;

  connectedCallback() {
    this.connected = true;
    // Registers this component's shadow root to receive monaco-editor's plain CSS.
    registerGlobalStyleTarget(getStyleTargetRoot(this.el));
  }

  async componentDidLoad() {
    const monaco = await loadMonaco();
    // `loadMonaco()` is always at least one microtask away, so this component can be
    // disconnected again before it resolves (e.g. a test mounting and immediately removing an
    // element). Without this check the editor/models would still get created for a detached
    // element and leak for the page's lifetime.
    if (!this.connected) return;
    this.monaco = monaco;
    this.monacoLoaded = true;
    this.editor = this.monaco.editor.create(this.container!, {
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      tabSize: 2,
      theme: 'vs-dark',
    });
    this.syncModels(this.filesState.files);
    this.showActiveModel();
    this.updateMarkers();
    this.editorReady.emit();
  }

  disconnectedCallback() {
    this.connected = false;
    unregisterGlobalStyleTarget(getStyleTargetRoot(this.el));
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

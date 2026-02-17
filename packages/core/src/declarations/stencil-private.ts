import { result } from '../utils';

import type { InMemoryFileSystem } from '../compiler/sys/in-memory-fs';
import type { CPSerializable } from './child_process';
import type {
  BuildEvents,
  BuildLog,
  BuildResultsComponentGraph,
  CompilerBuildResults,
  CompilerFsStats,
  CompilerRequestResponse,
  CompilerSystem,
  Config,
  CopyResults,
  DevServerConfig,
  DevServerEditor,
  Diagnostic,
  Logger,
  LoggerLineUpdater,
  LoggerTimeSpan,
  OptimizeCssInput,
  OptimizeCssOutput,
  OutputTarget,
  OutputTargetWww,
  PageReloadStrategy,
  PrerenderConfig,
  StyleDoc,
  ValidatedConfig,
} from './stencil-public-compiler';
import type { JsonDocMethodParameter } from './stencil-public-docs';
import type { ComponentInterface, ListenTargetOptions, VNode } from './stencil-public-runtime';

export interface DocData {
  hostIds: number;
  rootLevelIds: number;
  staticComponents: Set<string>;
}
export type StencilDocument = Document & { _stencilDocData: DocData };

export interface SourceMap {
  file: string;
  mappings: string;
  names: string[];
  sourceRoot?: string;
  sources: string[];
  sourcesContent?: (string | null)[];
  version: number;
}

export interface PrintLine {
  lineIndex: number;
  lineNumber: number;
  text: string;
  errorCharStart: number;
  errorLength?: number;
}

export interface AssetsMeta {
  absolutePath: string;
  cmpRelativePath: string;
  originalComponentPath: string;
}

export interface ParsedImport {
  importPath: string;
  basename: string;
  ext: string;
  data: ImportData;
}

export interface ImportData {
  tag?: string;
  encapsulation?: string;
  mode?: string;
}

export interface SerializeImportData extends ImportData {
  importeePath: string;
  importerPath?: string;
  /**
   * True if this is a node module import (e.g. using ~ prefix like ~foo/style.css)
   * These should be treated as bare module specifiers and not have ./ prepended
   */
  isNodeModule?: boolean;
}

export interface BuildFeatures {
  // encapsulation
  style: boolean;
  mode: boolean;
  formAssociated: boolean;

  // dom
  shadowDom: boolean;
  shadowDelegatesFocus: boolean;
  shadowSlotAssignmentManual: boolean;
  scoped: boolean;

  // render
  /**
   * Every component has a render function
   */
  allRenderFn: boolean;
  /**
   * At least one component has a render function
   */
  hasRenderFn: boolean;

  // vdom
  vdomRender: boolean;
  vdomAttribute: boolean;
  vdomClass: boolean;
  vdomFunctional: boolean;
  vdomKey: boolean;
  vdomListener: boolean;
  vdomPropOrAttr: boolean;
  vdomRef: boolean;
  vdomStyle: boolean;
  vdomText: boolean;
  vdomXlink: boolean;
  slotRelocation: boolean;

  // elements
  slot: boolean;
  svg: boolean;

  // decorators
  element: boolean;
  event: boolean;
  hostListener: boolean;
  hostListenerTargetWindow: boolean;
  hostListenerTargetDocument: boolean;
  hostListenerTargetBody: boolean;
  /**
   * @deprecated Prevented from new apps, but left in for older collections
   */
  hostListenerTargetParent: boolean;
  hostListenerTarget: boolean;
  method: boolean;
  prop: boolean;
  propChangeCallback: boolean;
  propMutable: boolean;
  state: boolean;
  member: boolean;
  updatable: boolean;
  propBoolean: boolean;
  propNumber: boolean;
  propString: boolean;
  serializer: boolean;
  deserializer: boolean;

  // lifecycle events
  lifecycle: boolean;
  asyncLoading: boolean;

  // attr
  observeAttribute: boolean;
  reflect: boolean;

  taskQueue: boolean;
}

export interface BuildConditionals extends Partial<BuildFeatures> {
  hotModuleReplacement?: boolean;
  isDebug?: boolean;
  isTesting?: boolean;
  isDev?: boolean;
  devTools?: boolean;
  invisiblePrehydration?: boolean;
  hydrateServerSide?: boolean;
  hydrateClientSide?: boolean;
  lifecycleDOMEvents?: boolean;
  cssAnnotations?: boolean;
  lazyLoad?: boolean;
  profile?: boolean;
  constructableCSS?: boolean;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  appendChildSlotFix?: boolean;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  slotChildNodesFix?: boolean;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  scopedSlotTextContentFix?: boolean;
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  cloneNodeFix?: boolean;
  hydratedAttribute?: boolean;
  hydratedClass?: boolean;
  hydratedSelectorName?: string;
  initializeNextTick?: boolean;
  // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
  shadowDomShim?: boolean;
  asyncQueue?: boolean;
  // TODO: deprecated in favour of `setTagTransformer` and `transformTag`. Remove in 5.0
  transformTagName?: boolean;
  additionalTagTransformers?: boolean | 'prod';
  attachStyles?: boolean;

  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  experimentalSlotFixes?: boolean;
  // TODO(STENCIL-1086): remove this option when it's the default behavior
  experimentalScopedSlotChanges?: boolean;
  addGlobalStyleToComponents?: boolean;
}

export type ModuleFormat =
  | 'amd'
  | 'cjs'
  | 'es'
  | 'iife'
  | 'system'
  | 'umd'
  | 'commonjs'
  | 'esm'
  | 'module'
  | 'systemjs';

export interface RollupResultModule {
  id: string;
}
export interface RollupResults {
  modules: RollupResultModule[];
}

export interface UpdatedLazyBuildCtx {
  name: 'esm-browser' | 'esm' | 'cjs' | 'system';
  buildCtx: BuildCtx;
}

export interface BuildCtx {
  buildId: number;
  buildResults: CompilerBuildResults;
  buildStats?: result.Result<CompilerBuildStats, { diagnostics: Diagnostic[] }>;
  buildMessages: string[];
  bundleBuildCount: number;
  collections: CollectionCompilerMeta[];
  compilerCtx: CompilerCtx;
  esmBrowserComponentBundle: ReadonlyArray<BundleModule>;
  esmComponentBundle: ReadonlyArray<BundleModule>;
  es5ComponentBundle: ReadonlyArray<BundleModule>;
  systemComponentBundle: ReadonlyArray<BundleModule>;
  commonJsComponentBundle: ReadonlyArray<BundleModule>;
  components: ComponentCompilerMeta[];
  componentGraph: Map<string, string[]>;
  config: ValidatedConfig;
  createTimeSpan(msg: string, debug?: boolean): LoggerTimeSpan;
  data: any;
  debug: (msg: string) => void;
  diagnostics: Diagnostic[];
  dirsAdded: string[];
  dirsDeleted: string[];
  entryModules: EntryModule[];
  filesAdded: string[];
  filesChanged: string[];
  filesDeleted: string[];
  filesUpdated: string[];
  filesWritten: string[];
  globalStyle: string | undefined;
  hasConfigChanges: boolean;
  hasError: boolean;
  hasFinished: boolean;
  hasHtmlChanges: boolean;
  hasPrintedResults: boolean;
  hasServiceWorkerChanges: boolean;
  hasScriptChanges: boolean;
  hasStyleChanges: boolean;
  hasWarning: boolean;
  hydrateAppFilePath: string;
  indexBuildCount: number;
  indexDoc: Document;
  isRebuild: boolean;
  /**
   * A collection of Stencil's intermediate representation of components, tied to the current build
   */
  moduleFiles: Module[];
  packageJson: PackageJsonData;
  pendingCopyTasks: Promise<CopyResults>[];
  progress(task: BuildTask): void;
  requiresFullBuild: boolean;
  rollupResults?: RollupResults;
  scriptsAdded: string[];
  scriptsDeleted: string[];
  startTime: number;
  styleBuildCount: number;
  /**
   * A promise that resolves to the global styles for the current build.
   */
  stylesPromise: Promise<string>;
  stylesUpdated: BuildStyleUpdate[];
  timeSpan: LoggerTimeSpan;
  timestamp: string;
  transpileBuildCount: number;
  validateTypesBuild?(): Promise<void>;
  validateTypesHandler?: (results: any) => Promise<void>;
  validateTypesPromise?: Promise<any>;
}

export interface BuildStyleUpdate {
  styleTag: string;
  styleText: string;
  styleMode: string;
}

export type BuildTask = any;

export interface CompilerBuildStats {
  timestamp: string;
  compiler: {
    name: string;
    version: string;
  };
  app: {
    namespace: string;
    fsNamespace: string;
    components: number;
    entries: number;
    bundles: number;
    outputs: any;
  };
  options: {
    minifyJs: boolean;
    minifyCss: boolean;
    hashFileNames: boolean;
    hashedFileNameLength: number;
    buildEs5: boolean | 'prod';
  };
  formats: {
    esmBrowser: ReadonlyArray<CompilerBuildStatBundle>;
    esm: ReadonlyArray<CompilerBuildStatBundle>;
    es5: ReadonlyArray<CompilerBuildStatBundle>;
    system: ReadonlyArray<CompilerBuildStatBundle>;
    commonjs: ReadonlyArray<CompilerBuildStatBundle>;
  };
  components: BuildComponent[];
  entries: EntryModule[];
  rollupResults: RollupResults;
  sourceGraph?: BuildSourceGraph;
  componentGraph: BuildResultsComponentGraph;
  collections: CompilerBuildStatCollection[];
}

export interface CompilerBuildStatCollection {
  name: string;
  source: string;
  tags: string[][];
}

export interface CompilerBuildStatBundle {
  key: string;
  components: string[];
  bundleId: string;
  fileName: string;
  imports: string[];
  originalByteSize: number;
}

export interface BuildSourceGraph {
  [filePath: string]: string[];
}

export interface BuildComponent {
  tag: string;
  dependencyOf?: string[];
  dependencies?: string[];
}

export type SourceTarget = 'es5' | 'es2017' | 'latest';

/**
 * A note regarding Rollup types:
 * As of this writing, there is no great way to import external types for packages that are directly embedded in the
 * Stencil source. As a result, some types are duplicated here for Rollup that will be used within the codebase.
 * Updates to rollup may require these typings to be updated.
 */

export type RollupResult = RollupChunkResult | RollupAssetResult;

export interface RollupAssetResult {
  type: 'asset';
  fileName: string;
  content: string;
}

export interface RollupChunkResult {
  type: 'chunk';
  entryKey: string;
  fileName: string;
  code: string;
  isEntry: boolean;
  isComponent: boolean;
  isCore: boolean;
  isIndex: boolean;
  isBrowserLoader: boolean;
  imports: string[];
  moduleFormat: ModuleFormat;
  map?: RollupSourceMap;
}

export interface RollupSourceMap {
  file: string;
  mappings: string;
  names: string[];
  sources: string[];
  sourcesContent: string[];
  version: number;
  toString(): string;
  toUrl(): string;
}

/**
 * Result of Stencil compressing, mangling, and otherwise 'minifying' JavaScript
 */
export type OptimizeJsResult = {
  output: string;
  diagnostics: Diagnostic[];
  sourceMap?: SourceMap;
};

export interface BundleModule {
  entryKey: string;
  rollupResult: RollupChunkResult;
  cmps: ComponentCompilerMeta[];
  output: BundleModuleOutput;
}

export interface BundleModuleOutput {
  bundleId: string;
  fileName: string;
  code: string;
}

export interface Cache {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  createKey(domain: string, ...args: any[]): Promise<string>;
  commit(): Promise<void>;
  clear(): void;
  clearDiskCache(): Promise<void>;
  getMemoryStats(): string;
  initCacheDir(): Promise<void>;
}

export interface CollectionCompilerMeta {
  collectionName: string;
  moduleId?: string;
  moduleDir: string;
  moduleFiles: Module[];
  global?: Module;
  compiler?: CollectionCompilerVersion;
  isInitialized?: boolean;
  hasExports?: boolean;
  dependencies?: string[];
  bundles?: {
    components: string[];
  }[];
}

export interface CollectionCompilerVersion {
  name: string;
  version: string;
  typescriptVersion?: string;
}

export interface CollectionManifest {
  entries?: CollectionComponentEntryPath[];
  collections?: CollectionDependencyManifest[];
  global?: string;
  compiler?: CollectionCompilerVersion;
  bundles?: CollectionBundleManifest[];
}

export type CollectionComponentEntryPath = string;

export interface CollectionBundleManifest {
  components: string[];
}

export interface CollectionDependencyManifest {
  name: string;
  tags: string[];
}

export interface CollectionCompiler {
  name: string;
  version: string;
  typescriptVersion?: string;
}

export interface CollectionDependencyData {
  name: string;
  tags: string[];
}

export interface CompilerCtx {
  version: number;
  activeBuildId: number;
  activeDirsAdded: string[];
  activeDirsDeleted: string[];
  activeFilesAdded: string[];
  activeFilesDeleted: string[];
  activeFilesUpdated: string[];
  addWatchDir: (path: string, recursive: boolean) => void;
  addWatchFile: (path: string) => void;
  cache: Cache;
  cssModuleImports: Map<string, string[]>;
  cachedGlobalStyle: string;
  collections: CollectionCompilerMeta[];
  compilerOptions: any;
  events: BuildEvents;
  fs: InMemoryFileSystem;
  hasSuccessfulBuild: boolean;
  isActivelyBuilding: boolean;
  lastBuildResults: CompilerBuildResults;
  /**
   * A mapping of a file path to a Stencil {@link Module}
   */
  moduleMap: ModuleMap;
  nodeMap: NodeMap;
  resolvedCollections: Set<string>;
  rollupCacheHydrate: any;
  rollupCacheLazy: any;
  rollupCacheNative: any;
  styleModeNames: Set<string>;
  changedModules: Set<string>;
  changedFiles: Set<string>;
  worker?: CompilerWorkerContext;

  rollupCache: Map<string, any>;

  reset(): void;
}

export type NodeMap = WeakMap<any, ComponentCompilerMeta>;

/**
 * Record, for a specific component, whether or not it has various features
 * which need to be handled correctly in the compilation pipeline.
 *
 * Note: this must be serializable to JSON.
 */
export interface ComponentCompilerFeatures {
  hasAttribute: boolean;
  hasAttributeChangedCallbackFn: boolean;
  hasComponentWillLoadFn: boolean;
  hasComponentDidLoadFn: boolean;
  hasComponentShouldUpdateFn: boolean;
  hasComponentWillUpdateFn: boolean;
  hasComponentDidUpdateFn: boolean;
  hasComponentWillRenderFn: boolean;
  hasComponentDidRenderFn: boolean;
  hasConnectedCallbackFn: boolean;
  hasDeserializer: boolean;
  hasDisconnectedCallbackFn: boolean;
  hasElement: boolean;
  hasEvent: boolean;
  hasLifecycle: boolean;
  hasListener: boolean;
  hasListenerTarget: boolean;
  hasListenerTargetWindow: boolean;
  hasListenerTargetDocument: boolean;
  hasListenerTargetBody: boolean;
  /**
   * @deprecated Prevented from new apps, but left in for older collections
   */
  hasListenerTargetParent: boolean;
  hasMember: boolean;
  hasMethod: boolean;
  hasMode: boolean;
  hasModernPropertyDecls: boolean;
  hasProp: boolean;
  hasPropBoolean: boolean;
  hasPropNumber: boolean;
  hasPropString: boolean;
  hasPropMutable: boolean;
  hasReflect: boolean;
  hasRenderFn: boolean;
  hasSerializer: boolean;
  hasSlot: boolean;
  hasState: boolean;
  hasStyle: boolean;
  hasVdomAttribute: boolean;
  hasVdomClass: boolean;
  hasVdomFunctional: boolean;
  hasVdomKey: boolean;
  hasVdomListener: boolean;
  hasVdomPropOrAttr: boolean;
  hasVdomRef: boolean;
  hasVdomRender: boolean;
  hasVdomStyle: boolean;
  hasVdomText: boolean;
  hasVdomXlink: boolean;
  hasWatchCallback: boolean;
  htmlAttrNames: string[];
  htmlTagNames: string[];
  htmlParts: string[];
  isUpdateable: boolean;
  /**
   * A plain component is one that doesn't have:
   * - any members decorated with `@Prop()`, `@State()`, `@Element()`, `@Method()`
   * - any methods decorated with `@Listen()`
   * - any styles
   * - any lifecycle methods, including `render()`
   */
  isPlain: boolean;
  /**
   * A collection of tag names of web components that a component references in its JSX/h() function
   */
  potentialCmpRefs: string[];
}

/**
 * Metadata about a given component
 *
 * Note: must be serializable to JSON!
 */
export interface ComponentCompilerMeta extends ComponentCompilerFeatures {
  assetsDirs: CompilerAssetDir[];
  /**
   * The name to which an `ElementInternals` object (the return value of
   * `HTMLElement.attachInternals`) should be attached at runtime. If this is
   * `null` then `attachInternals` should not be called.
   */
  attachInternalsMemberName: string | null;
  /**
   * Custom states to initialize on the ElementInternals.states CustomStateSet.
   * These are defined via @AttachInternals({ states: {...} }).
   */
  attachInternalsCustomStates: ComponentCompilerCustomState[];
  componentClassName: string;
  /**
   * A list of web component tag names that are either:
   * - directly referenced in a Stencil component's JSX/h() function
   * - are referenced by a web component that is directly referenced in a Stencil component's JSX/h() function
   */
  dependencies: string[];
  /**
   * A list of web component tag names that either:
   * - directly reference the current component directly in their JSX/h() function
   * - indirectly/transitively reference the current component directly in their JSX/h() function
   */
  dependents: string[];
  deserializers: ComponentCompilerChangeHandler[];
  /**
   * A list of web component tag names that are directly referenced in a Stencil component's JSX/h() function
   */
  directDependencies: string[];
  /**
   * A list of web component tag names that the current component directly in their JSX/h() function
   */
  directDependents: string[];
  docs: CompilerJsDoc;
  doesExtend: boolean;
  elementRef: string;
  encapsulation: Encapsulation;
  events: ComponentCompilerEvent[];
  excludeFromCollection: boolean;
  /**
   * Whether or not the component is form-associated
   */
  formAssociated: boolean;
  internal: boolean;
  isCollectionDependency: boolean;
  jsFilePath: string;
  listeners: ComponentCompilerListener[];
  methods: ComponentCompilerMethod[];
  properties: ComponentCompilerProperty[];
  serializers: ComponentCompilerChangeHandler[];
  shadowDelegatesFocus: boolean;
  /**
   * Slot assignment mode for shadow DOM. 'manual', enables imperative slotting
   * using HTMLSlotElement.assign(). Only applicable when encapsulation is 'shadow'.
   */
  slotAssignment: 'manual' | null;
  sourceFilePath: string;
  sourceMapPath: string;
  states: ComponentCompilerState[];
  styleDocs: CompilerStyleDoc[];
  styles: StyleCompiler[];
  tagName: string;
  virtualProperties: ComponentCompilerVirtualProperty[];
  watchers: ComponentCompilerChangeHandler[];
}

/**
 * The supported style encapsulation modes on a Stencil component:
 * 1. 'shadow' - native Shadow DOM
 * 2. 'scoped' - encapsulated styles and polyfilled slots
 * 3. 'none' - a basic HTML element
 */
export type Encapsulation = 'shadow' | 'scoped' | 'none';

/**
 * Intermediate Representation (IR) of a static property on a Stencil component
 */
export interface ComponentCompilerStaticProperty {
  mutable: boolean;
  optional: boolean;
  required: boolean;
  type: ComponentCompilerPropertyType;
  complexType: ComponentCompilerPropertyComplexType;
  attribute?: string;
  reflect?: boolean;
  docs: CompilerJsDoc;
  defaultValue?: string;
  getter: boolean;
  setter: boolean;
  ogPropName?: string;
}

/**
 * Intermediate Representation (IR) of a property on a Stencil component
 */
export interface ComponentCompilerProperty extends ComponentCompilerStaticProperty {
  name: string;
  internal: boolean;
}

export interface ComponentCompilerVirtualProperty {
  name: string;
  type: string;
  docs: string;
}

export type ComponentCompilerPropertyType = 'any' | 'string' | 'boolean' | 'number' | 'unknown';

/**
 * Information about a type used in a Stencil component or exported
 * from a Stencil project.
 */
export interface ComponentCompilerPropertyComplexType {
  /**
   * The string of the original type annotation in the Stencil source code
   */
  original: string;
  /**
   * A 'resolved' type, where e.g. imported types have been resolved and inlined
   *
   * For instance, an annotation like `(foo: Foo) => string;` will be
   * converted to `(foo: { foo: string }) => string;`.
   */
  resolved: string;
  /**
   * A record of the types which were referenced in the assorted type
   * annotation in the original source file.
   */
  references: ComponentCompilerTypeReferences;
}

/**
 * A record of `ComponentCompilerTypeReference` entities.
 *
 * Each key in this record is intended to be the names of the types used by a component. However, this is not enforced
 * by the type system (I.E. any string can be used as a key).
 *
 * Note any key can be a user defined type or a TypeScript standard type.
 */
export type ComponentCompilerTypeReferences = Record<string, ComponentCompilerTypeReference>;

/**
 * Describes a reference to a type used by a component.
 */
export interface ComponentCompilerTypeReference {
  /**
   * A type may be defined:
   * - locally (in the same file as the component that uses it)
   * - globally
   * - by importing it into a file (and is defined elsewhere)
   */
  location: 'local' | 'global' | 'import';
  /**
   * The path to the type reference, if applicable (global types should not need a path associated with them)
   */
  path?: string;
  /**
   * An ID for this type which is unique within a Stencil project.
   */
  id: string;
  /**
   * Whether this type was imported as a default import (e.g., `import MyEnum from './my-enum'`)
   * vs a named import (e.g., `import { MyType } from './my-type'`)
   */
  isDefault?: boolean;
  /**
   * The name used in the import statement (before any user-defined alias).
   * For `import { XAxisOption as moo }`, this would be "XAxisOption".
   * This is the name exported by the source module.
   */
  referenceLocation?: string;
}

/**
 * Information about a type which is referenced by another type on a Stencil
 * component, for instance a {@link ComponentCompilerPropertyComplexType} or a
 * {@link ComponentCompilerEventComplexType}.
 */
export interface ComponentCompilerReferencedType {
  /**
   * The path to the module where the type is declared.
   */
  path: string;
  /**
   * The string of the original type annotation in the Stencil source code
   */
  declaration: string;
  /**
   * An extracted docstring
   */
  docstring: string;
}

export interface ComponentCompilerStaticEvent {
  name: string;
  method: string;
  bubbles: boolean;
  cancelable: boolean;
  composed: boolean;
  docs: CompilerJsDoc;
  complexType: ComponentCompilerEventComplexType;
}

export interface ComponentCompilerEvent extends ComponentCompilerStaticEvent {
  internal: boolean;
}

export interface ComponentCompilerEventComplexType {
  original: string;
  resolved: string;
  references: ComponentCompilerTypeReferences;
}

export interface ComponentCompilerListener {
  name: string;
  method: string;
  capture: boolean;
  passive: boolean;
  target: ListenTargetOptions | undefined;
}

export interface ComponentCompilerStaticMethod {
  docs: CompilerJsDoc;
  complexType: ComponentCompilerMethodComplexType;
}

export interface ComponentCompilerMethodComplexType {
  signature: string;
  parameters: JsonDocMethodParameter[];
  references: ComponentCompilerTypeReferences;
  return: string;
}

export interface ComponentCompilerChangeHandler {
  propName: string;
  methodName: string;
  handlerOptions?: {
    immediate?: boolean;
  };
}

export interface ComponentCompilerMethod extends ComponentCompilerStaticMethod {
  name: string;
  internal: boolean;
}

export interface ComponentCompilerState {
  name: string;
}

/**
 * Metadata about a custom state defined via @AttachInternals({ states: {...} })
 *
 * Custom states are exposed via the ElementInternals.states CustomStateSet
 * and can be targeted with the CSS :state() pseudo-class.
 */
export interface ComponentCompilerCustomState {
  /**
   * The name of the custom state (without dashes)
   */
  name: string;
  /**
   * The initial value of the state
   */
  initialValue: boolean;
  /**
   * Optional JSDoc description for the state
   */
  docs: string;
}

/**
 * Representation of JSDoc that is pulled off a node in the AST
 */
export interface CompilerJsDoc {
  /**
   * The text associated with the JSDoc
   */
  text: string;
  /**
   * Tags included in the JSDoc
   */
  tags: CompilerJsDocTagInfo[];
}

/**
 * Representation of a tag that exists in a JSDoc
 */
export interface CompilerJsDocTagInfo {
  /**
   * The name of the tag - e.g. `@deprecated`
   */
  name: string;
  /**
   * Additional text that is associated with the tag - e.g. `@deprecated use v2 of this API`
   */
  text?: string;
}

/**
 * The (internal) representation of a CSS block comment in a CSS, Sass, etc. file. This data structure is used during
 * the initial compilation phases of Stencil, as a piece of {@link ComponentCompilerMeta}.
 */
export interface CompilerStyleDoc {
  /**
   * The name of the CSS property
   */
  name: string;
  /**
   * The user-defined description of the CSS property
   */
  docs: string;
  /**
   * The JSDoc-style annotation (e.g. `@prop`) that was used in the block comment to detect the comment.
   * Used to inform Stencil where the start of a new property's description starts (and where the previous description
   * ends).
   */
  annotation: 'prop';
  /**
   * The Stencil style-mode that is associated with this property.
   */
  mode: string;
}

export interface CompilerAssetDir {
  absolutePath?: string;
  cmpRelativePath?: string;
  originalComponentPath?: string;
}

export interface ComponentCompilerData {
  exportLine: string;
  filePath: string;
  cmp: ComponentCompilerMeta;
  uniqueComponentClassName?: string;
  importLine?: string;
}

export interface ComponentConstructor {
  is?: string;
  properties?: ComponentConstructorProperties;
  watchers?: ComponentConstructorChangeHandlers;
  events?: ComponentConstructorEvent[];
  listeners?: ComponentConstructorListener[];
  style?: string;
  styleId?: string;
  encapsulation?: ComponentConstructorEncapsulation;
  observedAttributes?: string[];
  cmpMeta?: ComponentRuntimeMeta;
  isProxied?: boolean;
  isStyleRegistered?: boolean;
  serializers?: ComponentConstructorChangeHandlers;
  deserializers?: ComponentConstructorChangeHandlers;
}

/**
 * A mapping from class member names to a list of methods which are watching
 * them.
 */
export interface ComponentConstructorChangeHandlers {
  [propName: string]: { [methodName: string]: number }[];
}

export interface ComponentTestingConstructor extends ComponentConstructor {
  COMPILER_META: ComponentCompilerMeta;
  prototype?: {
    componentWillLoad?: Function;
    componentWillUpdate?: Function;
    componentWillRender?: Function;
    __componentWillLoad?: Function | null;
    __componentWillUpdate?: Function | null;
    __componentWillRender?: Function | null;
  };
}

export interface ComponentNativeConstructor extends ComponentConstructor {
  cmpMeta: ComponentRuntimeMeta;
}

export type ComponentConstructorEncapsulation = 'shadow' | 'scoped' | 'none';

export interface ComponentConstructorProperties {
  [propName: string]: ComponentConstructorProperty;
}

export interface ComponentConstructorProperty {
  attribute?: string;
  elementRef?: boolean;
  method?: boolean;
  mutable?: boolean;
  reflect?: boolean;
  state?: boolean;
  type?: ComponentConstructorPropertyType;
  watchCallbacks?: string[];
}

export type ComponentConstructorPropertyType =
  | StringConstructor
  | BooleanConstructor
  | NumberConstructor
  | 'string'
  | 'boolean'
  | 'number';

export interface ComponentConstructorEvent {
  name: string;
  method: string;
  bubbles: boolean;
  cancelable: boolean;
  composed: boolean;
}

export interface ComponentConstructorListener {
  name: string;
  method: string;
  capture?: boolean;
  passive?: boolean;
}

export interface DevClientWindow extends Window {
  ['s-dev-server']: boolean;
  ['s-initial-load']: boolean;
  ['s-build-id']: number;
  WebSocket: new (socketUrl: string, protos: string[]) => WebSocket;
  devServerConfig?: DevClientConfig;
}

export interface DevClientConfig {
  basePath: string;
  editors: DevServerEditor[];
  reloadStrategy: PageReloadStrategy;
  socketUrl?: string;
}

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';
  acceptHeader: string;
  url: URL;
  searchParams: URLSearchParams;
  pathname?: string;
  filePath?: string;
  stats?: CompilerFsStats;
  headers?: { [name: string]: string };
  host?: string;
}

export interface DevServerMessage {
  startServer?: DevServerConfig;
  closeServer?: boolean;
  serverStarted?: DevServerConfig;
  serverClosed?: boolean;
  buildStart?: boolean;
  buildLog?: BuildLog;
  buildResults?: CompilerBuildResults;
  requestBuildResults?: boolean;
  error?: { message?: string; type?: string; stack?: any };
  isActivelyBuilding?: boolean;
  compilerRequestPath?: string;
  compilerRequestResults?: CompilerRequestResponse;
  requestLog?: {
    method: string;
    url: string;
    status: number;
  };
}

export type DevServerSendMessage = (msg: DevServerMessage) => void;

export interface DevServerContext {
  connectorHtml: string;
  dirTemplate: string;
  getBuildResults: () => Promise<CompilerBuildResults>;
  getCompilerRequest: (path: string) => Promise<CompilerRequestResponse>;
  isServerListening: boolean;
  logRequest: (req: HttpRequest, status: number) => void;
  prerenderConfig: PrerenderConfig;
  serve302: (req: any, res: any, pathname?: string) => void;
  serve404: (req: any, res: any, xSource: string, content?: string) => void;
  serve500: (req: any, res: any, error: any, xSource: string) => void;
  sys: CompilerSystem;
}

export type InitServerProcess = (sendMsg: (msg: DevServerMessage) => void) => (msg: DevServerMessage) => void;

export interface DevResponseHeaders {
  'cache-control'?: string;
  expires?: string;
  'content-type'?: string;
  'content-length'?: number;
  date?: string;
  'access-control-allow-origin'?: string;
  'access-control-expose-headers'?: string;
  'content-encoding'?: 'gzip';
  vary?: 'Accept-Encoding';
  server?: string;
  'x-directory-index'?: string;
  'x-source'?: string;
}

export interface OpenInEditorData {
  file?: string;
  line?: number;
  column?: number;
  open?: string;
  editor?: string;
  exists?: boolean;
  error?: string;
}

export interface EntryModule {
  entryKey: string;
  cmps: ComponentCompilerMeta[];
}

/**
 * An interface extending `HTMLElement` which describes the fields added onto
 * host HTML elements by the Stencil runtime.
 */
export interface HostElement extends HTMLElement {
  // web component APIs
  connectedCallback?: () => void;
  attributeChangedCallback?: (attribName: string, oldVal: string, newVal: string, namespace: string) => void;
  disconnectedCallback?: () => void;
  host?: Element;
  forceUpdate?: () => void;

  __stencil__getHostRef?: () => HostRef;

  // "s-" prefixed properties should not be property renamed
  // and should be common between all versions of stencil

  /**
   * Unique stencil id for this element
   */
  ['s-id']?: string;

  /**
   * Content Reference:
   * Reference to the HTML Comment that's placed inside of the
   * host element's original content. This comment is used to
   * always represent where host element's light dom is.
   */
  ['s-cr']?: RenderNode;

  /**
   * Lifecycle ready
   */
  ['s-lr']?: boolean;

  /**
   * A reference to the `ElementInternals` object for the current host
   *
   * This is used for maintaining a reference to the object between HMR
   * refreshes in the lazy build.
   *
   * "stencil-element-internals"
   */
  ['s-ei']?: ElementInternals;

  /**
   * On Render Callbacks:
   * Array of callbacks to fire off after it has rendered.
   */
  ['s-rc']?: (() => void)[];

  /**
   * Scope Id
   * The scope id of this component when using scoped css encapsulation
   * or using shadow dom but the browser doesn't support it
   */
  ['s-sc']?: string;

  /**
   * Scope Ids
   * All the possible scope ids of this component when using scoped css encapsulation
   * or using shadow dom but the browser doesn't support it
   */
  ['s-scs']?: string[];

  /**
   * Hot Module Replacement, dev mode only
   *
   * This function should be defined by the HMR-supporting runtime and should
   * do the work of actually updating the component in-place.
   */
  ['s-hmr']?: (versionId: string) => void;

  /**
   * A list of nested nested hydration promises that
   * must be resolved for the top, ancestor component to be fully hydrated
   */
  ['s-p']?: Promise<void>[];

  componentOnReady?: () => Promise<this>;
}

export interface HydrateResults {
  buildId: string;
  diagnostics: Diagnostic[];
  url: string;
  host: string | null;
  hostname: string | null;
  href: string | null;
  port: string | null;
  pathname: string | null;
  search: string | null;
  hash: string | null;
  html: string | null;
  components: HydrateComponent[];
  anchors: HydrateAnchorElement[];
  imgs: HydrateImgElement[];
  scripts: HydrateScriptElement[];
  styles: HydrateStyleElement[];
  staticData: HydrateStaticData[];
  title: string | null;
  hydratedCount: number;
  httpStatus: number | null;
}

export interface HydrateComponent {
  tag: string;
  mode: string;
  count: number;
  depth: number;
}

export interface HydrateElement {
  [attrName: string]: string | undefined;
}

export interface HydrateAnchorElement extends HydrateElement {
  href?: string;
  target?: string;
}

export interface HydrateImgElement extends HydrateElement {
  src?: string;
}

export interface HydrateScriptElement extends HydrateElement {
  src?: string;
  type?: string;
}

export interface HydrateStyleElement extends HydrateElement {
  id?: string;
  href?: string;
  content?: string;
}

export interface HydrateStaticData {
  id: string;
  type: string;
  content: string;
}

export interface JsDoc {
  name: string;
  documentation: string;
  type: string;
  tags: JSDocTagInfo[];
  default?: string;
  parameters?: JsDoc[];
  returns?: {
    type: string;
    documentation: string;
  };
}

export interface JSDocTagInfo {
  name: string;
  text?: string;
}

/**
 * A mapping from a TypeScript or JavaScript source file path on disk, to a Stencil {@link Module}.
 *
 * It is advised that the key (path) be normalized before storing/retrieving the `Module` to avoid unnecessary lookup
 * failures.
 */
export type ModuleMap = Map<string, Module>;

/**
 * Stencil's Intermediate Representation (IR) of a module, bundling together
 * various pieces of information like the classes declared within it, the path
 * to the original source file, HTML tag names defined in the file, and so on.
 *
 * Note that this gets serialized/parsed as JSON and therefore cannot contain a
 * `Map` or a `Set`.
 */
export interface Module {
  cmps: ComponentCompilerMeta[];
  isMixin: boolean;
  isExtended: boolean;
  /**
   * A collection of modules that a component will need. The modules in this list must have import statements generated
   * in order for the component to function.
   */
  coreRuntimeApis: string[];
  /**
   * A collection of modules that a component will need for a specific output target. The modules in this list must
   * have import statements generated in order for the component to function, but only for a specific output target.
   */
  outputTargetCoreRuntimeApis: Partial<Record<OutputTarget['type'], string[]>>;
  collectionName: string;
  dtsFilePath: string;
  excludeFromCollection: boolean;
  externalImports: string[];
  htmlAttrNames: string[];
  htmlTagNames: string[];
  htmlParts: string[];
  isCollectionDependency: boolean;
  isLegacy: boolean;
  jsFilePath: string;
  localImports: string[];
  /**
   * Source file paths of functional components that are used in JSX/h() calls.
   * This is used to ensure htmlTagNames are properly propagated from functional
   * component dependencies even when they're accessed indirectly (e.g., via barrel files).
   */
  functionalComponentDeps: string[];
  originalImports: string[];
  originalCollectionComponentPath: string;
  potentialCmpRefs: string[];
  sourceFilePath: string;
  staticSourceFile: any;
  staticSourceFileText: string;
  sourceMapPath: string;
  sourceMapFileText: string;

  // build features
  hasVdomAttribute: boolean;
  hasVdomClass: boolean;
  hasVdomFunctional: boolean;
  hasVdomKey: boolean;
  hasVdomListener: boolean;
  hasVdomPropOrAttr: boolean;
  hasVdomRef: boolean;
  hasVdomRender: boolean;
  hasVdomStyle: boolean;
  hasVdomText: boolean;
  hasVdomXlink: boolean;
}

export interface Plugin {
  name?: string;
  pluginType?: string;
  load?: (id: string, context: PluginCtx) => Promise<string> | string;
  resolveId?: (importee: string, importer: string, context: PluginCtx) => Promise<string> | string;
  transform?: (
    sourceText: string,
    id: string,
    context: PluginCtx,
  ) => Promise<PluginTransformResults> | PluginTransformResults;
}

export type PluginTransformResults = PluginTransformationDescriptor | string | null;

export interface PluginTransformationDescriptor {
  code?: string;
  map?: string;
  id?: string;
  diagnostics?: Diagnostic[];
  dependencies?: string[];
}

export interface PluginCtx {
  config: Config;
  sys: CompilerSystem;
  fs: InMemoryFileSystem;
  cache: Cache;
  diagnostics: Diagnostic[];
}

export interface PrerenderUrlResults {
  anchorUrls: string[];
  diagnostics: Diagnostic[];
  filePath: string;
}

export interface PrerenderUrlRequest {
  appDir: string;
  buildId: string;
  baseUrl: string;
  componentGraphPath: string;
  devServerHostUrl: string;
  hydrateAppFilePath: string;
  isDebug: boolean;
  prerenderConfigPath: string;
  staticSite: boolean;
  templateId: string;
  url: string;
  writeToFilePath: string;
}

export interface PrerenderManager {
  config: Config;
  prerenderUrlWorker: (prerenderRequest: PrerenderUrlRequest) => Promise<PrerenderUrlResults>;
  devServerHostUrl: string;
  diagnostics: Diagnostic[];
  hydrateAppFilePath: string;
  isDebug: boolean;
  logCount: number;
  outputTarget: OutputTargetWww;
  prerenderConfig: PrerenderConfig;
  prerenderConfigPath: string;
  progressLogger?: LoggerLineUpdater;
  resolve: Function;
  staticSite: boolean;
  templateId: string;
  componentGraphPath: string;
  urlsProcessing: Set<string>;
  urlsPending: Set<string>;
  urlsCompleted: Set<string>;
  maxConcurrency: number;
}

/**
 * Generic node that represents all of the
 * different types of nodes we'd see when rendering
 */
export interface RenderNode extends HostElement {
  /**
   * Shadow root's host
   */
  host?: Element;

  /**
   * On Ref Function:
   * Callback function to be called when the slotted node ref is ready.
   */
  ['s-rf']?: (elm: Element) => unknown;

  /**
   * Is initially hidden
   * Whether this node was originally rendered with the `hidden` attribute.
   *
   * Used to reset the `hidden` state of a node during slot relocation.
   */
  ['s-ih']?: boolean;

  /**
   * Is Content Reference Node:
   * This node is a content reference node.
   */
  ['s-cn']?: boolean;

  /**
   * Is a `slot` node when `shadow: false` (or `scoped: true`).
   *
   * This is a node (either empty text-node or `<slot-fb>` element)
   * that represents where a `<slot>` is located in the original JSX.
   */
  ['s-sr']?: boolean;

  /**
   * Slot name of either the slot itself or the slotted node
   */
  ['s-sn']?: string;

  /**
   * Host element tag name:
   * The tag name of the host element that this
   * node was created in.
   */
  ['s-hn']?: string;

  /**
   * Slot host tag name:
   * This is the tag name of the element where this node
   * has been moved to during slot relocation.
   *
   * This allows us to check if the node has been moved and prevent
   * us from thinking a node _should_ be moved when it may already be in
   * its final destination.
   *
   * This value is set to `undefined` whenever the node is put back into its original location.
   */
  ['s-sh']?: string;

  /**
   * Original Location Reference:
   * A reference pointing to the comment
   * which represents the original location
   * before it was moved to its slot.
   */
  ['s-ol']?: RenderNode;

  /**
   * Node reference:
   * This is a reference from an original location node
   * back to the node that's been moved around.
   */
  ['s-nr']?: PatchedSlotNode | RenderNode;

  /**
   * Original Order:
   * During SSR; a number representing the order of a slotted node
   */
  ['s-oo']?: number;

  /**
   * Scope Id
   */
  ['s-si']?: string;

  /**
   * Host Id (hydrate only)
   */
  ['s-host-id']?: number;

  /**
   * Node Id (hydrate only)
   */
  ['s-node-id']?: number;

  /**
   * Used to know the components encapsulation.
   * empty "" for shadow, "c" from scoped
   */
  ['s-en']?: '' | /*shadow*/ 'c' /*scoped*/;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the internal `childNodes` of the component
   */
  readonly __childNodes?: NodeListOf<ChildNode>;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the internal `children` of the component
   */
  readonly __children?: HTMLCollectionOf<Element>;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the internal `firstChild` of the component
   */
  readonly __firstChild?: ChildNode;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the internal `lastChild` of the component
   */
  readonly __lastChild?: ChildNode;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the internal `textContent` of the component
   */
  __textContent?: string;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * gives access to the original `append` method
   */
  __append?: (...nodes: (Node | string)[]) => void;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * gives access to the original `prepend` method
   */
  __prepend?: (...nodes: (Node | string)[]) => void;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * gives access to the original `appendChild` method
   */
  __appendChild?: <T extends Node>(newChild: T) => T;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * gives access to the original `insertBefore` method
   */
  __insertBefore?: <T extends Node>(node: T, child: Node | null) => T;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * gives access to the original `removeChild` method
   */
  __removeChild?: <T extends Node>(child: T) => T;
}

export interface PatchedSlotNode extends Node {
  /**
   * Slot name
   */
  ['s-sn']?: string;

  /**
   * Original Location Reference:
   * A reference pointing to the comment
   * which represents the original location
   * before it was moved to its slot.
   */
  ['s-ol']?: RenderNode;

  /**
   * Slot host tag name:
   * This is the tag name of the element where this node
   * has been moved to during slot relocation.
   *
   * This allows us to check if the node has been moved and prevent
   * us from thinking a node _should_ be moved when it may already be in
   * its final destination.
   *
   * This value is set to `undefined` whenever the node is put back into its original location.
   */
  ['s-sh']?: string;

  /**
   * Is a `slot` node when `shadow: false` (or `scoped: true`).
   *
   * This is a node (either empty text-node or `<slot-fb>` element)
   * that represents where a `<slot>` is located in the original JSX.
   */
  ['s-sr']?: boolean;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the actual `parentNode` of the component
   */
  __parentNode?: RenderNode;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the actual `nextSibling` of the component
   */
  __nextSibling?: RenderNode;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the actual `previousSibling` of the component
   */
  __previousSibling?: RenderNode;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the actual `nextElementSibling` of the component
   */
  __nextElementSibling?: RenderNode;

  /**
   * On a `scoped: true` component
   * with `experimentalSlotFixes` flag enabled,
   * returns the actual `nextElementSibling` of the component
   */
  __previousElementSibling?: RenderNode;
}

export type LazyBundlesRuntimeData = LazyBundleRuntimeData[];

export type LazyBundleRuntimeData = [
  /** bundleIds */
  string,
  ComponentRuntimeMetaCompact[],
];

export type ComponentRuntimeMetaCompact = [
  /** flags */
  number,

  /** tagname */
  string,

  /** members */
  { [memberName: string]: ComponentRuntimeMember }?,

  /** listeners */
  ComponentRuntimeHostListener[]?,

  /** watchers */
  ComponentConstructorChangeHandlers?,

  /** serializers */
  ComponentConstructorChangeHandlers?,

  /** deserializers */
  ComponentConstructorChangeHandlers?,
];

/**
 * Runtime metadata for a Stencil component
 */
export interface ComponentRuntimeMeta {
  /**
   * This number is used to hold a series of bitflags for various features we
   * support on components. The flags which this value is intended to store are
   * documented in the `CMP_FLAGS` enum.
   */
  $flags$: number;
  /**
   * Just what it says on the tin - the tag name for the component, as set in
   * the `@Component` decorator.
   */
  $tagName$: string;
  /**
   * A map of the component's members, which could include fields decorated
   * with `@Prop`, `@State`, etc as well as methods.
   */
  $members$?: ComponentRuntimeMembers;
  /**
   * Information about listeners on the component.
   */
  $listeners$?: ComponentRuntimeHostListener[];
  /**
   * Tuples containing information about `@Prop` fields on the component which
   * are set to be reflected (i.e. kept in sync) as HTML attributes when
   * updated.
   */
  $attrsToReflect$?: ComponentRuntimeReflectingAttr[];
  /**
   * Information about which class members have watchers attached on the component.
   */
  $watchers$?: ComponentConstructorChangeHandlers;
  /**
   * A bundle ID used for lazy loading.
   */
  $lazyBundleId$?: string;
  /**
   * Information about which class members have prop > attribute serializers attached on the component.
   */
  $serializers$?: ComponentConstructorChangeHandlers;
  /**
   * Information about which class members have attribute > prop deserializers attached on the component.
   */
  $deserializers$?: ComponentConstructorChangeHandlers;
}

/**
 * A mapping of the names of members on the component to some runtime-specific
 * information about them.
 */
export interface ComponentRuntimeMembers {
  [memberName: string]: ComponentRuntimeMember;
}

/**
 * A tuple with information about a class member that's relevant at runtime.
 * The fields are:
 *
 * 1. A number used to hold bitflags for component members. The bit flags which
 * this is intended to store are documented in the `MEMBER_FLAGS` enum.
 * 2. The attribute name to observe.
 */
export type ComponentRuntimeMember = [number, string?];

/**
 * A tuple holding information about a host listener which is relevant at
 * runtime. The field are:
 *
 * 1. A number used to hold bitflags for listeners. The bit flags which this is
 * intended to store are documented in the `LISTENER_FLAGS` enum.
 * 2. The event name.
 * 3. The method name.
 */
export type ComponentRuntimeHostListener = [number, string, string];

/**
 * A tuple containing information about props which are "reflected" at runtime,
 * meaning that HTML attributes on the component instance are kept in sync with
 * the prop value.
 *
 * The fields are:
 *
 * 1. the prop name
 * 2. the prop attribute.
 */
export type ComponentRuntimeReflectingAttr = [string, string | undefined];

/**
 * A runtime component reference, consistent of either a host element _or_ an
 * empty object. This is used in particular in a few different places as the
 * keys in a `WeakMap` which maps {@link HostElement} instances to their
 * associated {@link HostRef} instance.
 */
export type RuntimeRef = HostElement | { __stencil__getHostRef?: () => HostRef };

/**
 * Interface used to track an Element, it's virtual Node (`VNode`), and other data
 */
export interface HostRef {
  $ancestorComponent$?: HostElement;
  $flags$: number;
  $cmpMeta$: ComponentRuntimeMeta;
  $hostElement$: HostElement;
  $instanceValues$?: Map<string, any>;
  $serializerValues$?: Map<string, string>;
  $lazyInstance$?: ComponentInterface;
  /**
   * A list of callback functions called immediately after a lazy component module has been fetched.
   */
  $fetchedCbList$?: ((elm: HostElement) => void)[];
  /**
   * A promise that gets resolved if `BUILD.asyncLoading` is enabled and after the `componentDidLoad`
   * and before the `componentDidUpdate` lifecycle events are triggered.
   */
  $onReadyPromise$?: Promise<HostElement>;
  /**
   * A callback which resolves {@link HostRef.$onReadyPromise$}
   * @param elm host element
   */
  $onReadyResolve$?: (elm: HostElement) => void;
  /**
   * A promise which resolves with the host component once it has finished rendering
   * for the first time. This is primarily used to wait for the first `update` to be
   * called on a component.
   */
  $onInstancePromise$?: Promise<HostElement>;
  /**
   * A callback which resolves {@link HostRef.$onInstancePromise$}
   * @param elm host element
   */
  $onInstanceResolve$?: (elm: HostElement) => void;
  /**
   * A promise which resolves when the component has finished rendering for the first time.
   * It is called after {@link HostRef.$onInstancePromise$} resolves.
   */
  $onRenderResolve$?: () => void;
  $vnode$?: VNode;
  $queuedListeners$?: [string, any][];
  $rmListeners$?: (() => void)[];
  $modeName$?: string;
  $renderCount$?: number;
  /**
   * Defer connectedCallback until after first render for components with slot relocation.
   */
  $deferredConnectedCallback$?: boolean;
}

export interface PlatformRuntime {
  /**
   * This number is used to hold a series of bitflags for various features we
   * support within the runtime. The flags which this value is intended to store are
   * documented in the {@link PLATFORM_FLAGS} enum.
   */
  $flags$: number;
  /**
   * Holds a map of nodes to be hydrated.
   */
  $orgLocNodes$?: Map<string, RenderNode>;
  /**
   * Holds the resource url for given platform environment.
   */
  $resourcesUrl$: string;
  /**
   * The nonce value to be applied to all script/style tags at runtime.
   * If `null`, the nonce attribute will not be applied.
   */
  $nonce$?: string | null;
  /**
   * A utility function that executes a given function and returns the result.
   * @param c The callback function to execute
   */
  jmp: (c: Function) => any;
  /**
   * A wrapper for {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame `requestAnimationFrame`}
   */
  raf: (c: FrameRequestCallback) => number;
  /**
   * A wrapper for {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener `addEventListener`}
   */
  ael: (
    el: EventTarget,
    eventName: string,
    listener: EventListenerOrEventListenerObject,
    options: boolean | AddEventListenerOptions,
  ) => void;
  /**
   * A wrapper for {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener `removeEventListener`}
   */
  rel: (
    el: EventTarget,
    eventName: string,
    listener: EventListenerOrEventListenerObject,
    options: boolean | AddEventListenerOptions,
  ) => void;
  /**
   * A wrapper for creating a {@link https://developer.mozilla.org/docs/Web/API/CustomEvent `CustomEvent`}
   */
  ce: (eventName: string, opts?: any) => CustomEvent;
}

export type StyleMap = Map<string, CSSStyleSheet | string>;

export type RootAppliedStyleMap = WeakMap<Element, Set<string>>;

export interface StyleCompiler {
  modeName: string;
  styleId: string;
  styleStr: string;
  styleIdentifier: string;
  externalStyles: ExternalStyleCompiler[];
}

export interface ExternalStyleCompiler {
  absolutePath: string;
  relativePath: string;
  originalComponentPath: string;
}

export interface CompilerModeStyles {
  [modeName: string]: string[];
}

export interface CssImportData {
  srcImport: string;
  updatedImport?: string;
  url: string;
  filePath: string;
  altFilePath?: string;
  styleText?: string | null;
  modifiers?: string;
}

export interface CssToEsmImportData {
  srcImportText: string;
  varName: string;
  url: string;
  filePath: string;
  /**
   * True if this is a node module import (e.g. using ~ prefix like ~foo/style.css)
   * These should be treated as bare module specifiers and not have ./ prepended
   */
  isNodeModule?: boolean;
}

/**
 * Input CSS to be transformed into ESM
 */
export interface TransformCssToEsmInput {
  input: string;
  module?: 'cjs' | 'esm' | string;
  file?: string;
  tag?: string;
  tags?: string[];
  addTagTransformers: boolean;
  encapsulation?: string;
  /**
   * The mode under which the CSS will be applied.
   *
   * Corresponds to a key used when `@Component`'s `styleUrls` field is an object:
   * ```ts
   * @Component({
   *   tag: 'todo-list',
   *   styleUrls: {
   *      ios: 'todo-list.ios.scss',
   *      md: 'todo-list.md.scss',
   *   }
   * })
   * ```
   * In the example above, two `TransformCssToEsmInput`s should be created, one for 'ios' and one for 'md' (this field
   * is not shared by multiple fields, nor is it a composite of multiple modes).
   */
  mode?: string;
  sourceMap?: boolean;
  minify?: boolean;
  docs?: boolean;
  autoprefixer?: any;
  styleImportData?: string;
}

export interface TransformCssToEsmOutput {
  styleText: string;
  output: string;
  map: any;
  diagnostics: Diagnostic[];
  defaultVarName: string;
  styleDocs: StyleDoc[];
  imports: { varName: string; importPath: string }[];
}

export interface PackageJsonData {
  name?: string;
  version?: string;
  main?: string;
  exports?: { [key: string]: string | { [key: string]: string } };
  description?: string;
  bin?: { [key: string]: string };
  browser?: string;
  module?: string;
  'jsnext:main'?: string;
  'collection:main'?: string;
  unpkg?: string;
  collection?: string;
  types?: string;
  files?: string[];
  ['dist-tags']?: {
    latest: string;
  };
  dependencies?: {
    [moduleId: string]: string;
  };
  devDependencies?: {
    [moduleId: string]: string;
  };
  repository?: {
    type?: string;
    url?: string;
  };
  private?: boolean;
  scripts?: {
    [runName: string]: string;
  };
  license?: string;
  keywords?: string[];
}

export interface Workbox {
  generateSW(swConfig: any): Promise<any>;
  generateFileManifest(): Promise<any>;
  getFileManifestEntries(): Promise<any>;
  injectManifest(swConfig: any): Promise<any>;
  copyWorkboxLibraries(wwwDir: string): Promise<any>;
}

export interface SerializedEvent {
  bubbles: boolean;
  cancelBubble: boolean;
  cancelable: boolean;
  composed: boolean;
  currentTarget: any;
  defaultPrevented: boolean;
  detail: any;
  eventPhase: any;
  isTrusted: boolean;
  returnValue: any;
  srcElement: any;
  target: any;
  timeStamp: number;
  type: string;
  isSerializedEvent: boolean;
}

export interface EventInitDict {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
  detail?: any;
}

export interface AnyHTMLElement extends HTMLElement {
  [key: string]: any;
}

export interface SpecPage {
  /**
   * Mocked testing `document.body`.
   */
  body: HTMLBodyElement;
  /**
   * Mocked testing `document`.
   */
  doc: HTMLDocument;
  /**
   * The first component found within the mocked `document.body`. If a component isn't found, then it'll return `document.body.firstElementChild`.
   */
  root?: AnyHTMLElement;
  /**
   * Similar to `root`, except returns the component instance. If a root component was not found it'll return `null`.
   */
  rootInstance?: any;
  /**
   * Convenience function to set `document.body.innerHTML` and `waitForChanges()`. Function argument should be a HTML string.
   */
  setContent: (html: string) => Promise<any>;
  /**
   * After changes have been made to a component, such as a update to a property or attribute, the test page does not automatically apply the changes. In order to wait for, and apply the update, call `await page.waitForChanges()`.
   */
  waitForChanges: () => Promise<any>;
  /**
   * Mocked testing `window`.
   */
  win: Window;

  build: BuildConditionals;
  flushLoadModule: (bundleId?: string) => Promise<any>;
  flushQueue: () => Promise<any>;
  styles: Map<string, string>;
}

/**
 * Options pertaining to the creation and functionality of a {@link SpecPage}
 */
export interface NewSpecPageOptions {
  /**
   * An array of components to test. Component classes can be imported into the spec file, then their reference should be added to the `component` array in order to be used throughout the test.
   */
  components: any[];
  /**
   * Sets the mocked `document.cookie`.
   */
  cookie?: string;
  /**
   * Sets the mocked `dir` attribute on `<html>`.
   */
  direction?: string;
  /**
   * If `false`, do not flush the render queue on initial test setup.
   */
  flushQueue?: boolean;
  /**
   * The initial HTML used to generate the test. This can be useful to construct a collection of components working together, and assign HTML attributes. This value sets the mocked `document.body.innerHTML`.
   */
  html?: string;
  /**
   * The initial JSX used to generate the test.
   * Use `template` when you want to initialize a component using their properties, instead of their HTML attributes.
   * It will render the specified template (JSX) into `document.body`.
   */
  template?: () => any;
  /**
   * Sets the mocked `lang` attribute on `<html>`.
   */
  language?: string;
  /**
   * Useful for debugging hydrating components client-side. Sets that the `html` option already includes annotated prerender attributes and comments.
   */
  hydrateClientSide?: boolean;
  /**
   * Useful for debugging hydrating components server-side. The output HTML will also include prerender annotations.
   */
  hydrateServerSide?: boolean;
  /**
   * Sets the mocked `document.referrer`.
   */
  referrer?: string;
  /**
   * Manually set if the mocked document supports Shadow DOM or not. Default is `true`.
   */
  supportsShadowDom?: boolean;
  /**
   * When a component is pre-rendered it includes HTML annotations, such as `s-id` attributes and `<!-t.0->` comments. This information is used by client-side hydrating. Default is `false`.
   */
  includeAnnotations?: boolean;
  /**
   * Sets the mocked browser's `location.href`.
   */
  url?: string;
  /**
   * Sets the mocked browser's `navigator.userAgent`.
   */
  userAgent?: string;
  /**
   * By default, any changes to component properties and attributes must `page.waitForChanges()` in order to test the updates. As an option, `autoApplyChanges` continuously flushes the queue on the background. Default is `false`.
   */
  autoApplyChanges?: boolean;
  /**
   * By default, styles are not attached to the DOM and they are not reflected in the serialized HTML.
   * Setting this option to `true` will include the component's styles in the serializable output.
   */
  attachStyles?: boolean;
  /**
   * Set {@link BuildConditionals} for testing based off the metadata of the component under test.
   * When `true` all `BuildConditionals` will be assigned to the global testing `BUILD` object, regardless of their
   * value. When `false`, only `BuildConditionals` with a value of `true` will be assigned to the `BUILD` object.
   */
  strictBuild?: boolean;
  /**
   * Default values to be set on the platform runtime object {@see PlatformRuntime} when creating
   * the spec page.
   */
  platform?: Partial<PlatformRuntime>;
}

/**
 * A record of `TypesMemberNameData` entities.
 *
 * Each key in this record is intended to be the path to a file that declares one or more types used by a component.
 * However, this is not enforced by the type system - users of this interface should not make any assumptions regarding
 * the format of the path used as a key (relative vs. absolute)
 */
export interface TypesImportData {
  [key: string]: TypesMemberNameData[];
}

/**
 * A type describing how Stencil may alias an imported type to avoid naming collisions when performing operations such
 * as generating `components.d.ts` files.
 */
export interface TypesMemberNameData {
  /**
   * The original name of the import before any aliasing was applied.
   *
   * i.e. if a component imports a type as follows:
   * `import { MyType as MyCoolType } from './my-type';`
   *
   * the `originalName` would be 'MyType'. If the import is not aliased, then `originalName` and `localName` will be the same.
   */
  originalName: string;
  /**
   * The name of the type as it's used within a file.
   */
  localName: string;
  /**
   * An alias that Stencil may apply to the `localName` to avoid naming collisions. This name does not appear in the
   * file that is using `localName`.
   */
  importName?: string;
  /**
   * Whether this is a default import/export (e.g., `import MyEnum from './my-enum'`)
   * vs a named import/export (e.g., `import { MyType } from './my-type'`)
   */
  isDefault?: boolean;
}

export interface TypesModule {
  isDep: boolean;
  tagName: string;
  tagNameAsPascal: string;
  htmlElementName: string;
  component: string;
  jsx: string;
  element: string;
  explicitAttributes: string | null;
  explicitProperties: string | null;
  requiredProps: Array<{
    name: string;
    type: string;
    complexType?: ComponentCompilerProperty['complexType'];
  }> | null;
}

export type TypeInfo = {
  name: string;
  type: string;
  optional: boolean;
  required: boolean;
  internal: boolean;
  jsdoc?: string;
}[];

export type ChildType = VNode | number | string;

export type PropsType = VNodeProdData | number | string | null;

export interface VNodeProdData {
  key?: string | number;
  class?: { [className: string]: boolean } | string;
  className?: { [className: string]: boolean } | string;
  style?: any;
  [key: string]: any;
}

/**
 * An abstraction to bundle up four methods which _may_ be handled by
 * dispatching work to workers running in other OS threads or may be called
 * synchronously. Environment and `CompilerSystem` related setup code will
 * determine which one, but in either case the call sites for these methods can
 * dispatch to this shared interface.
 */
export interface CompilerWorkerContext {
  optimizeCss(inputOpts: OptimizeCssInput): Promise<OptimizeCssOutput>;
  prepareModule(
    input: string,
    minifyOpts: any,
    transpile: boolean,
    inlineHelpers: boolean,
  ): Promise<{ output: string; diagnostics: Diagnostic[]; sourceMap?: SourceMap }>;
  prerenderWorker(prerenderRequest: PrerenderUrlRequest): Promise<PrerenderUrlResults>;
  transformCssToEsm(input: TransformCssToEsmInput): Promise<TransformCssToEsmOutput>;
}

/**
 * The methods that are supported on a {@link CompilerWorkerContext}
 */
export type WorkerContextMethod = keyof CompilerWorkerContext;

/**
 * A little type guard which will cause a type error if the parameter `T` does
 * not satisfy {@link CPSerializable} (i.e. if it's not possible to cleanly
 * serialize it for message passing via an IPC channel).
 */
type IPCSerializable<T extends CPSerializable> = T;

/**
 * A manifest for a job that a worker thread should carry out, as determined by
 * and dispatched from the main thread. This includes the name of the task to do
 * and any arguments necessary to carry it out properly.
 *
 * This message must satisfy {@link CPSerializable} so it can be sent from the
 * main thread to a worker thread via an IPC channel
 */
export type MsgToWorker<T extends WorkerContextMethod> = IPCSerializable<{
  stencilId: number;
  method: T;
  args: Parameters<CompilerWorkerContext[T]>;
}>;

/**
 * A manifest for a job that a worker thread should carry out, as determined by
 * and dispatched from the main thread. This includes the name of the task to do
 * and any arguments necessary to carry it out properly.
 *
 * This message must satisfy {@link CPSerializable} so it can be sent from the
 * main thread to a worker thread via an IPC channel
 */
export type MsgFromWorker<T extends WorkerContextMethod> = IPCSerializable<{
  stencilId?: number;
  stencilRtnValue: ReturnType<CompilerWorkerContext[T]>;
  stencilRtnError: string | null;
}>;

/**
 * A description of a task which should be passed to a worker in another
 * thread. This interface differs from {@link MsgToWorker} in that it doesn't
 * have to be serializable for transmission through an IPC channel, so we can
 * hold things like a `resolve` and `reject` callback to use when the task
 * completes.
 */
export interface CompilerWorkerTask {
  stencilId: number;
  inputArgs: any[];
  resolve: (val: any) => any;
  reject: (msg: string) => any;
  retries: number;
}

/**
 * A handler for IPC messages from the main thread to a worker thread. This
 * involves dispatching an action specified by a {@link MsgToWorker} object to a
 * {@link CompilerWorkerContext}.
 *
 * @param msgToWorker the message to handle
 * @returns the return value of the specified function
 */
export type WorkerMsgHandler = <T extends WorkerContextMethod>(
  msgToWorker: MsgToWorker<T>,
) => ReturnType<CompilerWorkerContext[T]>;

export interface TranspileModuleResults {
  sourceFilePath: string;
  code: string;
  map: any;
  diagnostics: Diagnostic[];
  moduleFile: Module;
}

export interface ValidateTypesResults {
  diagnostics: Diagnostic[];
  dirPaths: string[];
  filePaths: string[];
}

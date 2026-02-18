// MEMBER_FLAGS base values
const MF_String = 1 << 0;
const MF_Number = 1 << 1;
const MF_Boolean = 1 << 2;
const MF_Any = 1 << 3;
const MF_Unknown = 1 << 4;
const MF_State = 1 << 5;

export const MEMBER_FLAGS = {
  String: MF_String,
  Number: MF_Number,
  Boolean: MF_Boolean,
  Any: MF_Any,
  Unknown: MF_Unknown,

  State: MF_State,
  Method: 1 << 6,
  Event: 1 << 7,
  Element: 1 << 8,

  ReflectAttr: 1 << 9,
  Mutable: 1 << 10,

  Getter: 1 << 11,
  Setter: 1 << 12,

  Prop: MF_String | MF_Number | MF_Boolean | MF_Any | MF_Unknown,
  HasAttribute: MF_String | MF_Number | MF_Boolean | MF_Any | MF_Unknown,
  PropLike: MF_String | MF_Number | MF_Boolean | MF_Any | MF_Unknown | MF_State,
} as const;

export const WATCH_FLAGS = {
  Immediate: 1 << 0,
} as const;

export const EVENT_FLAGS = {
  Cancellable: 1 << 0,
  Composed: 1 << 1,
  Bubbles: 1 << 2,
} as const;

export const LISTENER_FLAGS = {
  Passive: 1 << 0,
  Capture: 1 << 1,

  TargetDocument: 1 << 2,
  TargetWindow: 1 << 3,
  TargetBody: 1 << 4,

  /**
   * @deprecated Prevented from new apps, but left in for older collections
   */
  TargetParent: 1 << 5,
} as const;

export const HOST_FLAGS = {
  hasConnected: 1 << 0,
  hasRendered: 1 << 1,
  isWaitingForChildren: 1 << 2,
  isConstructingInstance: 1 << 3,
  isQueuedForUpdate: 1 << 4,
  hasInitializedComponent: 1 << 5,
  hasLoadedComponent: 1 << 6,
  isWatchReady: 1 << 7,
  isListenReady: 1 << 8,
  needsRerender: 1 << 9,

  // DEV ONLY
  devOnRender: 1 << 10,
  devOnDidLoad: 1 << 11,
} as const;

// CMP_FLAGS base values
const CF_scopedCssEncapsulation = 1 << 1;
const CF_needsShadowDomShim = 1 << 3;

/**
 * A set of flags used for bitwise calculations against {@link ComponentRuntimeMeta#$flags$}.
 *
 * These flags should only be used in conjunction with {@link ComponentRuntimeMeta#$flags$}.
 * They should _not_ be used for calculations against other fields/numbers
 */
export const CMP_FLAGS = {
  /**
   * Used to determine if a component is using the shadow DOM.
   * e.g. `shadow: true | {}` is set on the `@Component()` decorator
   */
  shadowDomEncapsulation: 1 << 0,
  /**
   * Used to determine if a component is using scoped stylesheets
   * e.g. `scoped: true` is set on the `@Component()` decorator
   */
  scopedCssEncapsulation: CF_scopedCssEncapsulation,
  /**
   * Used to determine if a component does not use the shadow DOM _and_ has `<slot/>` tags in its markup.
   */
  hasSlotRelocation: 1 << 2,
  // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
  // Note that when we remove this field we should consider whether we need to
  // retain a placeholder here, since if we want to have compatibility between
  // different versions of the runtime then we'll need to not shift the values
  // of the other higher flags down
  /**
   * Determines if a shim for the shadow DOM is necessary.
   *
   * The shim should only be needed if a component requires {@link shadowDomEncapsulation} and if any output
   * target-specific criteria are met. Refer to this flag's usage to determine each output target's criteria.
   */
  needsShadowDomShim: CF_needsShadowDomShim,
  /**
   * Determines if `delegatesFocus` is enabled for a component that uses the shadow DOM.
   * e.g. `shadow: { delegatesFocus: true }` is set on the `@Component()` decorator
   */
  shadowDelegatesFocus: 1 << 4,
  /**
   * Determines if `mode` is set on the `@Component()` decorator
   */
  hasMode: 1 << 5,
  // TODO(STENCIL-854): Remove code related to legacy shadowDomShim field
  /**
   * Determines if styles must be scoped due to either:
   * 1. A component is using scoped stylesheets ({@link scopedCssEncapsulation})
   * 2. A component is using the shadow DOM _and_ the output target's rules for requiring a shadow DOM shim have been
   * met ({@link needsShadowDomShim})
   */
  needsScopedEncapsulation: CF_scopedCssEncapsulation | CF_needsShadowDomShim,
  /**
   * Determines if a component is form-associated or not. This is set based on
   * options passed to the `@Component` decorator.
   */
  formAssociated: 1 << 6,

  /**
   * Determines if a `shadow: true` component needs
   * to have its styles scoped during SSR as opposed to using DSD.
   */
  shadowNeedsScopedCss: 1 << 7,

  /**
   * Determines if a component has a `<slot>` in its template.
   */
  hasSlot: 1 << 8,

  /**
   * Determines if a component uses modern class property declarations.
   */
  hasModernPropertyDecls: 1 << 9,

  /**
   * Determines if `slotAssignment` is set to `'manual'` for a component that uses the shadow DOM.
   * e.g. `shadow: { slotAssignment: 'manual' }` is set on the `@Component()` decorator
   */
  shadowSlotAssignmentManual: 1 << 10,
} as const;

/**
 * Default style mode id
 */
export const DEFAULT_STYLE_MODE = '$';

/**
 * Namespaces
 */
export const SVG_NS = 'http://www.w3.org/2000/svg';
export const HTML_NS = 'http://www.w3.org/1999/xhtml';
export const XLINK_NS = 'http://www.w3.org/1999/xlink';

/**
 * File names and value
 */
export const COLLECTION_MANIFEST_FILE_NAME = 'collection-manifest.json';

/**
 * Constant for the 'copy' output target
 */
export const COPY = 'copy';
/**
 * Constant for the 'custom' output target
 */
export const CUSTOM = 'custom';
/**
 * Constant for the 'dist' output target
 */
export const DIST = 'dist';
/**
 * Constant for the 'dist-collection' output target
 */
export const DIST_COLLECTION = 'dist-collection';
/**
 * Constant for the 'dist-custom-elements' output target
 */
export const DIST_CUSTOM_ELEMENTS = 'dist-custom-elements';

/**
 * Constant for the 'dist-types' output target
 */
export const DIST_TYPES = 'dist-types';
/**
 * Constant for the 'dist-hydrate-script' output target
 */
export const DIST_HYDRATE_SCRIPT = 'dist-hydrate-script';
/**
 * Constant for the 'dist-lazy' output target
 */
export const DIST_LAZY = 'dist-lazy';
/**
 * Constant for the 'dist-lazy-loader' output target
 */
export const DIST_LAZY_LOADER = 'dist-lazy-loader';
/**
 * Constant for the 'dist-global-styles' output target
 */
export const DIST_GLOBAL_STYLES = 'dist-global-styles';
/**
 * Constant for the 'docs-custom' output target
 */
export const DOCS_CUSTOM = 'docs-custom';
/**
 * Constant for the 'docs-json' output target
 */
export const DOCS_JSON = 'docs-json';
/**
 * Constant for the 'docs-readme' output target
 */
export const DOCS_README = 'docs-readme';
/**
 * Constant for the 'docs-vscode' output target
 */
export const DOCS_VSCODE = 'docs-vscode';
/**
 * Constant for the 'docs-custom-elements-manifest' output target
 */
export const DOCS_CUSTOM_ELEMENTS_MANIFEST = 'docs-custom-elements-manifest';
/**
 * Constant for the 'stats' output target
 */
export const STATS = 'stats';
/**
 * Constant for the 'www' output target
 */
export const WWW = 'www';

/**
 * Valid output targets to specify in a Stencil config.
 *
 * Note that there are some output targets (e.g. `DIST_TYPES`) which are
 * programmatically set as output targets by the compiler when other output
 * targets (in that case `DIST`) are set, but which are _not_ supported in a
 * Stencil config. This is enforced in the output target validation code.
 */
export const VALID_CONFIG_OUTPUT_TARGETS = [
  // DIST
  WWW,
  DIST,
  DIST_COLLECTION,
  DIST_CUSTOM_ELEMENTS,
  DIST_LAZY,
  DIST_HYDRATE_SCRIPT,

  // DOCS
  DOCS_JSON,
  DOCS_README,
  DOCS_VSCODE,
  DOCS_CUSTOM,
  DOCS_CUSTOM_ELEMENTS_MANIFEST,

  // MISC
  COPY,
  CUSTOM,
  STATS,
] as const;

export const GENERATED_DTS = 'components.d.ts';

/**
 * DOM Node types
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
 *
 * Note: this is a duplicate of the `NODE_TYPES` enum in mock-doc, it's
 * copied over here so that we do not need to introduce a dependency on the
 * mock-doc bundle in the runtime. See
 * https://github.com/stenciljs/core/pull/5705 for more details.
 */
export const NODE_TYPES = {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12,
} as const;

/**
 * Represents a primitive type.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-PrimitiveProtocolValue.
 */
export const PrimitiveType = {
  Undefined: 'undefined',
  Null: 'null',
  String: 'string',
  Number: 'number',
  SpecialNumber: 'number',
  Boolean: 'boolean',
  BigInt: 'bigint',
} as const;

export type PrimitiveTypeValue = (typeof PrimitiveType)[keyof typeof PrimitiveType];

/**
 * Represents a non-primitive type.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-RemoteValue.
 * @deprecated will be removed in v5. Use `@AttrDeserialize()` / `@PropDeserialize()` decorators instead.
 */
export const NonPrimitiveType = {
  Array: 'array',
  Date: 'date',
  Map: 'map',
  Object: 'object',
  RegularExpression: 'regexp',
  Set: 'set',
  Channel: 'channel',
  Symbol: 'symbol',
} as const;

export type NonPrimitiveTypeValue = (typeof NonPrimitiveType)[keyof typeof NonPrimitiveType];

/**  @deprecated will be removed in v5. Use `@AttrDeserialize()` / `@PropDeserialize()` decorators instead. */
export const TYPE_CONSTANT = 'type';
/**  @deprecated will be removed in v5. Use `@AttrDeserialize()` / `@PropDeserialize()` decorators instead. */
export const VALUE_CONSTANT = 'value';
/**  @deprecated will be removed in v5. Use `@AttrDeserialize()` / `@PropDeserialize()` decorators instead. */
export const SERIALIZED_PREFIX = 'serialized:';

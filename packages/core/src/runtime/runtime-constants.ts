/**
 * Bit flags for recording various properties of VDom nodes
 */
export const VNODE_FLAGS = {
  /**
   * Whether or not a vdom node is a slot reference
   */
  isSlotReference: 1 << 0,

  /**
   * Whether or not a slot element has fallback content
   */
  isSlotFallback: 1 << 1,

  /**
   * Whether or not an element is a host element
   */
  isHost: 1 << 2,
} as const;

export const PROXY_FLAGS = {
  isElementConstructor: 1 << 0,
  proxyState: 1 << 1,
} as const;

// PLATFORM_FLAGS base values
const PF_appLoaded = 1 << 1;
const PF_queueSync = 1 << 2;

export const PLATFORM_FLAGS = {
  /**
   * designates a node in the DOM as being actively moved by the runtime
   */
  isTmpDisconnected: 1 << 0,
  appLoaded: PF_appLoaded,
  queueSync: PF_queueSync,

  queueMask: PF_appLoaded | PF_queueSync,
} as const;

/**
 * A (subset) of node types which are relevant for the Stencil runtime. These
 * values are based on the values which can possibly be returned by the
 * `.nodeType` property of a DOM node. See here for details:
 *
 * {@link https://dom.spec.whatwg.org/#ref-for-dom-node-nodetype%E2%91%A0}
 */
export const NODE_TYPE = {
  ElementNode: 1,
  TextNode: 3,
  CommentNode: 8,
  DocumentNode: 9,
  DocumentTypeNode: 10,
  DocumentFragment: 11,
} as const;

export const CONTENT_REF_ID = 'r';
export const ORG_LOCATION_ID = 'o';
export const SLOT_NODE_ID = 's';
export const TEXT_NODE_ID = 't';
export const COMMENT_NODE_ID = 'c';

export const HYDRATE_ID = 's-id';
export const HYDRATED_STYLE_ID = 'sty-id';
export const HYDRATE_CHILD_ID = 'c-id';
export const HYDRATED_CSS = '{visibility:hidden}.hydrated{visibility:inherit}';

export const STENCIL_DOC_DATA = '_stencilDocData';
export const DEFAULT_DOC_DATA = {
  hostIds: 0,
  rootLevelIds: 0,
  staticComponents: new Set<string>(),
};

/**
 * Constant for styles to be globally applied to `slot-fb` elements for pseudo-slot behavior.
 *
 * Two cascading rules must be used instead of a `:not()` selector due to Stencil browser
 * support as of Stencil v4.
 */
export const SLOT_FB_CSS = 'slot-fb{display:contents}slot-fb[hidden]{display:none}';

export const XLINK_NS = 'http://www.w3.org/1999/xlink';

export const FORM_ASSOCIATED_CUSTOM_ELEMENT_CALLBACKS = [
  'formAssociatedCallback',
  'formResetCallback',
  'formDisabledCallback',
  'formStateRestoreCallback',
] as const;

// Hydration marker IDs (used by serialize-node.ts)
export const CONTENT_REF_ID = 'r';
export const ORG_LOCATION_ID = 'o';
export const SLOT_NODE_ID = 's';
export const TEXT_NODE_ID = 't';
export const HYDRATE_ID = 's-id';

// XML namespace for xlink attributes
export const XLINK_NS = 'http://www.w3.org/1999/xlink';

export const enum NODE_TYPES {
  ELEMENT_NODE = 1,
  ATTRIBUTE_NODE = 2,
  TEXT_NODE = 3,
  CDATA_SECTION_NODE = 4,
  ENTITY_REFERENCE_NODE = 5,
  ENTITY_NODE = 6,
  PROCESSING_INSTRUCTION_NODE = 7,
  COMMENT_NODE = 8,
  DOCUMENT_NODE = 9,
  DOCUMENT_TYPE_NODE = 10,
  DOCUMENT_FRAGMENT_NODE = 11,
  NOTATION_NODE = 12,
}

export const enum NODE_NAMES {
  COMMENT_NODE = '#comment',
  DOCUMENT_NODE = '#document',
  DOCUMENT_FRAGMENT_NODE = '#document-fragment',
  TEXT_NODE = '#text',
}

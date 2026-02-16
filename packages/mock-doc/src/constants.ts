// Hydration marker IDs (used by serialize-node.ts)
export const CONTENT_REF_ID = 'r';
export const ORG_LOCATION_ID = 'o';
export const SLOT_NODE_ID = 's';
export const TEXT_NODE_ID = 't';
export const HYDRATE_ID = 's-id';

// Standard XML namespaces
export const XLINK_NS = 'http://www.w3.org/1999/xlink';
export const XML_NS = 'http://www.w3.org/XML/1998/namespace';
export const XMLNS_NS = 'http://www.w3.org/2000/xmlns/';

/**
 * Get the standard prefix for a namespace URI.
 * Returns null if namespace has no standard prefix.
 */
export function getPrefixForNamespace(namespaceURI: string | null): string | null {
  if (namespaceURI === XLINK_NS) return 'xlink';
  if (namespaceURI === XML_NS) return 'xml';
  if (namespaceURI === XMLNS_NS) return 'xmlns';
  return null;
}

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

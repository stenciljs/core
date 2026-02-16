import { MockDocument } from './document';
import { parseDocumentUtil, parseFragmentUtil } from './parse-util';

let sharedDocument: MockDocument;

export function parseHtmlToDocument(html: string, ownerDocument: MockDocument = null) {
  if (ownerDocument == null) {
    if (sharedDocument == null) {
      sharedDocument = new MockDocument();
    }
    ownerDocument = sharedDocument;
  }

  return parseDocumentUtil(ownerDocument, html);
}

export function parseHtmlToFragment(html: string, ownerDocument: MockDocument = null) {
  if (ownerDocument == null) {
    if (sharedDocument == null) {
      sharedDocument = new MockDocument();
    }
    ownerDocument = sharedDocument;
  }

  return parseFragmentUtil(ownerDocument, html);
}

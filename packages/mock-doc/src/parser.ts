import { MockDocument } from './document';
import { parseHtmlToDocument } from './parse-html';

export type DOMParserSupportedType =
  | 'text/html'
  | 'text/xml'
  | 'application/xml'
  | 'application/xhtml+xml'
  | 'image/svg+xml';

export class MockDOMParser {
  parseFromString(htmlToParse: string, mimeType: DOMParserSupportedType): MockDocument {
    if (mimeType !== 'text/html') {
      console.error('XML parsing not implemented yet, continuing as html');
    }
    return parseHtmlToDocument(htmlToParse);
  }
}

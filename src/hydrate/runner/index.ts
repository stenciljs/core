import { transformTag } from '@platform';
export { createWindowFromHtml } from './create-window';
export { hydrateDocument, renderToString, serializeDocumentToString, streamToString } from './render';
export { setTagTransformer, transformTag } from '@platform';
export { deserializeProperty, serializeProperty } from '@utils';

let everywhere: any;
try {
  everywhere = global || globalThis;
} catch (e) {
  everywhere = window || globalThis;
}
everywhere.tagTransform = transformTag;

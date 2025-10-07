import { transformTag } from '@platform';
export { createWindowFromHtml } from './create-window';
export { hydrateDocument, renderToString, serializeDocumentToString, streamToString } from './render';
export { setTagTransformer, transformTag } from '@platform';
export { deserializeProperty, serializeProperty } from '@utils';

(global as any).tagTransform = transformTag;

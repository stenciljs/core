export { createWindowFromHtml } from './create-window';
export {
  hydrateDocument,
  ssrDocument,
  renderToString,
  serializeDocumentToString,
  streamToString,
} from './render';
export { resetReusableWindows } from './reusable-window';
export { resetSsrDocData } from './window-initialize';

import { setTagTransformer as setRuntimeTagTransformer, transformTag } from '../../runtime';
import { resetReusableWindows } from './reusable-window';

/**
 * Render components under transformed tag names, to match tag transformation on the client.
 *
 * Components are registered under their transformed names when a window's SSR platform is set up,
 * so this also discards the reusable windows (see the `reuseWindow` option): later renders set up
 * new ones that use the new transformer.
 *
 * (A function declaration with its own name, so the runtime's `setTagTransformer` keeps its name in
 * the bundle - the SSR build looks for it - and this is hoisted.)
 * @param transformer the tag transformer
 */
function setTagTransformerForSsr(transformer: Parameters<typeof setRuntimeTagTransformer>[0]) {
  setRuntimeTagTransformer(transformer);
  resetReusableWindows();
}
export { setTagTransformerForSsr as setTagTransformer, transformTag };

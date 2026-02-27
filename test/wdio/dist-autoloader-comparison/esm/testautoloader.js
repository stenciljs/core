import { p as promiseResolve, b as bootstrapLazy } from './index-a81GMR2d.js';
export { s as setNonce } from './index-a81GMR2d.js';
import { g as globalScripts } from './app-globals-DQuL1Twl.js';

/*
 Stencil Client Patch Browser v4.43.1-dev.1772051958.852ff35 | MIT Licensed | https://stenciljs.com
 */

var patchBrowser = () => {
  const importMeta = import.meta.url;
  const opts = {};
  if (importMeta !== '') {
    opts.resourcesUrl = new URL('.', importMeta).href;
  }
  return promiseResolve(opts);
};

patchBrowser().then(async (options) => {
  await globalScripts();
  return bootstrapLazy(
    [
      ['auto-loader-dynamic', [[1, 'auto-loader-dynamic']]],
      ['auto-loader-root', [[1, 'auto-loader-root']]],
      ['auto-loader-child', [[1, 'auto-loader-child']]],
    ],
    options,
  );
});

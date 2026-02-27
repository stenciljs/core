'use strict';

var index = require('./index-Bb4sLbFj.js');
var appGlobals = require('./app-globals-V2Kpy_OQ.js');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
/*
 Stencil Client Patch Browser v4.43.1-dev.1772051958.852ff35 | MIT Licensed | https://stenciljs.com
 */

var patchBrowser = () => {
  const importMeta =
    typeof document === 'undefined'
      ? require('u' + 'rl').pathToFileURL(__filename).href
      : (_documentCurrentScript &&
          _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' &&
          _documentCurrentScript.src) ||
        new URL('testautoloader.cjs.js', document.baseURI).href;
  const opts = {};
  if (importMeta !== '') {
    opts.resourcesUrl = new URL('.', importMeta).href;
  }
  return index.promiseResolve(opts);
};

patchBrowser().then(async (options) => {
  await appGlobals.globalScripts();
  return index.bootstrapLazy(
    [
      ['auto-loader-dynamic.cjs', [[1, 'auto-loader-dynamic']]],
      ['auto-loader-root.cjs', [[1, 'auto-loader-root']]],
      ['auto-loader-child.cjs', [[1, 'auto-loader-child']]],
    ],
    options,
  );
});

exports.setNonce = index.setNonce;

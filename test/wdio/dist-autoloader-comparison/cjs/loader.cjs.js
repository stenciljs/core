'use strict';

var index = require('./index-Bb4sLbFj.js');
var appGlobals = require('./app-globals-V2Kpy_OQ.js');

const defineCustomElements = async (win, options) => {
  if (typeof window === 'undefined') return undefined;
  await appGlobals.globalScripts();
  return index.bootstrapLazy(
    [
      ['auto-loader-dynamic.cjs', [[1, 'auto-loader-dynamic']]],
      ['auto-loader-root.cjs', [[1, 'auto-loader-root']]],
      ['auto-loader-child.cjs', [[1, 'auto-loader-child']]],
    ],
    options,
  );
};

exports.setNonce = index.setNonce;
exports.defineCustomElements = defineCustomElements;

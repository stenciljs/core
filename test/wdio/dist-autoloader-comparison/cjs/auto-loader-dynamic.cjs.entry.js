'use strict';

var index = require('./index-Bb4sLbFj.js');

const AutoLoaderDynamic = class {
  constructor(hostRef) {
    index.registerInstance(this, hostRef);
  }
  render() {
    return index.h(
      'div',
      { key: 'aacd03b6a40acc54738d4ac5a6444bb269c0798a', class: 'dynamic-loaded' },
      index.h('span', { key: 'e55dad42bf5ce20ded06b9bb0e7a8a1bf81fc9e8' }, 'Dynamic Component Loaded'),
      index.h('auto-loader-child', { key: '40887a9b29557eb0a29e7ed5fe2198605d59b93e' }),
    );
  }
};

exports.auto_loader_dynamic = AutoLoaderDynamic;

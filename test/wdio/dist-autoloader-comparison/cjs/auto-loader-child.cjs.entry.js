'use strict';

var index = require('./index-Bb4sLbFj.js');

const AutoLoaderChild = class {
  constructor(hostRef) {
    index.registerInstance(this, hostRef);
  }
  render() {
    return index.h(
      'div',
      { key: 'b20ab7eacb042a15a3b6dd2ab2a8b71be55338be', class: 'child-loaded' },
      index.h('span', { key: '0b3e19c01e888f934df4fe0f0e3dafa2ef938681' }, 'Child Component Loaded'),
    );
  }
};

exports.auto_loader_child = AutoLoaderChild;

'use strict';

var index = require('./index-Bb4sLbFj.js');

const AutoLoaderRoot = class {
  constructor(hostRef) {
    index.registerInstance(this, hostRef);
  }
  render() {
    return index.h(
      'div',
      { key: '07cd39168c8b70a78870956182d8989e46123491', class: 'root-loaded' },
      index.h('span', { key: 'b91ebff6e3bb3fd833ec8687fe7837bb46f48415' }, 'Root Component Loaded'),
    );
  }
};

exports.auto_loader_root = AutoLoaderRoot;

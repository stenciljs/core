import { r as registerInstance, h } from './index-a81GMR2d.js';

const AutoLoaderDynamic = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
  }
  render() {
    return h(
      'div',
      { key: 'aacd03b6a40acc54738d4ac5a6444bb269c0798a', class: 'dynamic-loaded' },
      h('span', { key: 'e55dad42bf5ce20ded06b9bb0e7a8a1bf81fc9e8' }, 'Dynamic Component Loaded'),
      h('auto-loader-child', { key: '40887a9b29557eb0a29e7ed5fe2198605d59b93e' }),
    );
  }
};

export { AutoLoaderDynamic as auto_loader_dynamic };

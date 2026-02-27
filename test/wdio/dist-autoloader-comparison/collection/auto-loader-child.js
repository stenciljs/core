import { h } from '@stencil/core';
export class AutoLoaderChild {
  render() {
    return h(
      'div',
      { key: 'b20ab7eacb042a15a3b6dd2ab2a8b71be55338be', class: 'child-loaded' },
      h('span', { key: '0b3e19c01e888f934df4fe0f0e3dafa2ef938681' }, 'Child Component Loaded'),
    );
  }
  static get is() {
    return 'auto-loader-child';
  }
  static get encapsulation() {
    return 'shadow';
  }
}

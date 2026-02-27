import { h } from '@stencil/core';
export class AutoLoaderRoot {
  render() {
    return h(
      'div',
      { key: '07cd39168c8b70a78870956182d8989e46123491', class: 'root-loaded' },
      h('span', { key: 'b91ebff6e3bb3fd833ec8687fe7837bb46f48415' }, 'Root Component Loaded'),
    );
  }
  static get is() {
    return 'auto-loader-root';
  }
  static get encapsulation() {
    return 'shadow';
  }
}

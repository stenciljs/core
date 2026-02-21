import { Component, h } from '@stencil/core';

import { createAndAppendElement } from './cmp-util.js';

@Component({
  tag: 'custom-elements-hierarchy-lifecycle-parent',
  shadow: true,
})
export class CustomElementsHierarchyLifecycleParent {
  async componentDidLoad(): Promise<void> {
    createAndAppendElement('DID LOAD PARENT');
    return Promise.resolve();
  }

  render() {
    return <custom-elements-hierarchy-lifecycle-child></custom-elements-hierarchy-lifecycle-child>;
  }
}

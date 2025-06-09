import { Component, h } from '@stencil/core';

import { createAndAppendElement } from './cmp-util.js';

@Component({
  tag: 'custom-elements-hierarchy-lifecycle-child',
  shadow: true,
})
export class CustomElementsHierarchyLifecycleChild {
  async componentDidLoad(): Promise<void> {
    createAndAppendElement('DID LOAD CHILD');
    return Promise.resolve();
  }

  render() {
    return <p>CHILD CONTENT</p>;
  }
}

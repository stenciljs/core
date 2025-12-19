import { Component, Element, h, Method } from '@stencil/core';

@Component({
  tag: 'parent-tag-transform',
  styleUrl: 'parent-tag-transform.css',
  shadow: true,
})
export class TagTransformParent {
  @Element() el: HTMLElement;

  @Method()
  async querySelectorAllChildTags() {
    return this.el.shadowRoot?.querySelectorAll('child-tag-transform');
  }

  @Method()
  async querySelectorChildTags() {
    return this.el.shadowRoot?.querySelector('child-tag-transform');
  }

  @Method()
  async createChildTagElement() {
    return document.createElement('child-tag-transform');
  }

  @Method()
  async customElementsGetChild() {
    return customElements.get('child-tag-transform');
  }

  render() {
    return (
      <div>
        <h2>Parent Component</h2>
        <child-tag-transform message="Hello from Parent!"></child-tag-transform>
        <child-tag-transform message="Another Child"></child-tag-transform>
      </div>
    );
  }
}

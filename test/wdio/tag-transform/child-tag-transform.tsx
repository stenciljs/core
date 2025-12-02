import { Component, Element, h, Method, Prop } from '@stencil/core';

@Component({
  tag: 'child-tag-transform',
  styles: /* css */ `
    child-tag-transform {
      display: block;
      padding: 10px;
      margin: 5px 0;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #f0f0f0;
    }

    child-tag-transform.active {
      border-color: #007acc;
      background: #e6f2ff;
    }

    child-tag-transform:hover {
      background: #d0e7ff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
  `,
})
export class TagTransformChild {
  @Element() el: HTMLElement;

  @Prop() message: string = 'Hello from Child';

  @Method()
  async closestParentTag() {
    return this.el.closest<HTMLParentTagTransformElement>('parent-tag-transform');
  }

  render() {
    return (
      <div>
        <h2>Child Component</h2>
        <slot />
      </div>
    );
  }
}

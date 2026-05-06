import { Component, Element } from '@stencil/core';

@Component({
  tag: 'attribute-basic-root',
})
export class AttributeBasicRoot {
  @Element() el!: HTMLElement;

  testClick() {
    const cmp = this.el.querySelector('attribute-basic')!;

    cmp.setAttribute('single', 'single-update');
    cmp.setAttribute('multi-word', 'multiWord-update');
    cmp.setAttribute('my-custom-attr', 'my-custom-attr-update');
    cmp.setAttribute('getter', 'getter-update');
  }

  render() {
    return (
      <div>
        <button onClick={this.testClick.bind(this)}>Test</button>
        <attribute-basic></attribute-basic>
      </div>
    );
  }
}

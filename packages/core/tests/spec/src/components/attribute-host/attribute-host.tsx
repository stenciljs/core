import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'attribute-host',
  styles: `
    [color='lime'] {
      background: lime;
    }
    section::before {
      content: attr(content);
    }
    [padding='true'] {
      padding: 50px;
    }
    [margin] {
      margin: 50px;
    }
    [bold='true'] {
      font-weight: bold;
    }
  `,
})
export class AttributeHost {
  @State() attrsAdded = false;

  testClick() {
    this.attrsAdded = !this.attrsAdded;
  }

  render() {
    const propsToRender: any = {};

    if (this.attrsAdded) {
      propsToRender.color = 'lime';
      propsToRender.content = 'attributes added';
      propsToRender.padding = true;
      propsToRender.margin = '';
      propsToRender.bold = 'true';
      propsToRender['no-attr'] = null;
    } else {
      propsToRender.content = 'attributes removed';
      propsToRender.padding = false;
      propsToRender.bold = 'false';
      propsToRender['no-attr'] = null;
    }

    return [
      <button onClick={this.testClick.bind(this)}>{this.attrsAdded ? 'Remove' : 'Add'} Attributes</button>,
      <section
        {...propsToRender}
        style={{
          'border-color': this.attrsAdded ? 'black' : '',
          display: this.attrsAdded ? 'block' : 'inline-block',
          fontSize: this.attrsAdded ? '24px' : '',
          '--css-var': this.attrsAdded ? '12' : '',
        }}
      />,
    ];
  }
}

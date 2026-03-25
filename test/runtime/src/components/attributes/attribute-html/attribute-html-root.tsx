import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'attribute-html-root',
})
export class AttributeHtmlRoot {
  @Prop() strAttr?: string;
  @Prop() anyAttr?: any;
  @Prop() nuAttr?: number;

  render() {
    return [
      <p>
        strAttr:{' '}
        <strong id="str-attr">
          {this.strAttr} {typeof this.strAttr}
        </strong>
      </p>,
      <p>
        anyAttr:{' '}
        <strong id="any-attr">
          {this.anyAttr} {typeof this.anyAttr}
        </strong>
      </p>,
      <p>
        nuAttr:{' '}
        <strong id="nu-attr">
          {this.nuAttr} {typeof this.nuAttr}
        </strong>
      </p>,
    ];
  }
}

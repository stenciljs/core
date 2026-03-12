import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'prefix-prop-nested',
})
export class PrefixPropNested {
  @Prop() message?: string;
  @Prop() count?: number;
  @Prop() nullValue?: string | null;
  @Prop() undefinedValue?: string | undefined;

  render() {
    return (
      <div class="nested-output">
        <div class="message">{this.message}</div>
        <div class="count">{this.count}</div>
        <div class="null-value">{String(this.nullValue)}</div>
        <div class="undefined-value">{String(this.undefinedValue)}</div>
      </div>
    );
  }
}

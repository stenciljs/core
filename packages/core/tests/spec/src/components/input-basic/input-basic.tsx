import { Component, Element, h, Prop } from '@stencil/core';

@Component({
  tag: 'input-basic-root',
})
export class InputBasicRoot {
  @Element() el!: HTMLElement;
  @Prop({ mutable: true }) value?: string;

  render() {
    return (
      <div>
        <p>
          Value: <span class="value">{this.value}</span>
        </p>
        <input type="text" value={this.value} onInput={(ev: any) => (this.value = ev.target.value)}></input>
      </div>
    );
  }
}

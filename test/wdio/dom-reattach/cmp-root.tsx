import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'dom-reattach',
})
export class DomReattach {
  @Prop({ mutable: true }) willLoad = 0;
  @Prop({ mutable: true }) didLoad = 0;
  @Prop({ mutable: true }) didUnload = 0;

  componentWillLoad() {
    this.willLoad++;
  }

  componentDidLoad() {
    this.didLoad++;
  }

  disconnectedCallback() {
    this.didUnload++;
  }

  render() {
    return (
      <Host>
        <p>componentWillLoad: {this.willLoad}</p>
        <p>componentDidLoad: {this.didLoad}</p>
        <p>disconnectedCallback: {this.didUnload}</p>
      </Host>
    );
  }
}

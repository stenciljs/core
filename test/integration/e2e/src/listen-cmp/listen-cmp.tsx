import { Component, Listen, Prop } from '@stencil/core';

@Component({
  tag: 'listen-cmp',
  styles: `
    listen-cmp {
      display: block;
      padding: 10px;
      background: #eee;
    }
  `,
})
export class ListenCmp {
  @Prop({ mutable: true }) opened = false;

  @Listen('click')
  handleClick() {
    this.opened = !this.opened;
  }

  render() {
    return (
      <div>
        <p>Click me to toggle "opened" property: {this.opened ? 'true' : 'false'}</p>
      </div>
    );
  }
}

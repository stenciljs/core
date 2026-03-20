import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'my-app',
  shadow: true,
})
export class MyApp {
  @Prop() offset = 0;
  render() {
    return (
      <Host class="my-app">
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
        <my-list offset={this.offset}></my-list>
      </Host>
    );
  }
}

import { Component, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'slow-ssr-prop',
  shadow: true,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class MyApp {
  @Prop() anArray = [];

  render() {
    return (
      <Host>
        <div>
          An array component:
          <ol>
            {this.anArray.map((item) => (
              <li>{item}</li>
            ))}
          </ol>
        </div>
      </Host>
    );
  }
}

import { Component, Host, Prop } from '@stencil/core';

@Component({
  tag: 'slow-ssr-prop',
  encapsulation: { type: 'shadow' },
  styles: `
    :host {
      display: block;
    }
  `,
})
export class MyApp {
  @Prop() anArray: string[] = [];

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

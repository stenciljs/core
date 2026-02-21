import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'my-list',
  shadow: true,
})
export class MyList {
  @Prop() offset = 0;
  onClick = () => {
    console.log('click');
  };
  render() {
    const items = Array.from({ length: 50 }, (_, i) => i);
    return (
      <Host
        class={{
          'class-one': true,
          'class-two': true,
          'class-three': true,
          'class-four': true,
          'class-five': true,
          'class-six': true,
          'class-seven': true,
        }}
      >
        Hello World
        <div role="dialog" onClick={this.onClick}>
          <ul>
            {items.map((i) => (
              <my-item
                index={i + this.offset}
                class={{
                  [`class-index-${i}`]: true,
                }}
              >
                <span>
                  <button type="button">Button index {this.offset + i}</button>
                </span>
              </my-item>
            ))}
          </ul>
        </div>
      </Host>
    );
  }
}

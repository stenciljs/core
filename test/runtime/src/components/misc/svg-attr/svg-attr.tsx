import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'svg-attr',
})
export class SvgAttr {
  @State() isOpen = false;

  testClick() {
    this.isOpen = !this.isOpen;
  }

  render() {
    return (
      <div>
        <div>
          <button onClick={this.testClick.bind(this)}>Test</button>
        </div>
        <div>
          {this.isOpen ? (
            <svg viewBox="0 0 54 54">
              <rect
                transform="rotate(45 27 27)"
                y="22"
                width="54"
                height="10"
                rx="2"
                stroke="yellow"
                stroke-width="5px"
                stroke-dasharray="8 4"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 54 54">
              <rect y="0" width="54" height="10" rx="2" stroke="blue" stroke-width="2px" stroke-dasharray="4 2" />
            </svg>
          )}
        </div>
      </div>
    );
  }
}

import { Component, State, h } from '@stencil/core';

@Component({
  tag: 'dom-interaction',
  shadow: true,
})
export class DomInteractionCmp {
  @State() clickMsg = 'Click';
  @State() focusMsg = 'Focus';
  @State() tapMsg = 'Tap';

  render() {
    return (
      <div>
        <section>
          <button onClick={() => (this.clickMsg = 'Was Clicked')} class="click">
            {this.clickMsg}
          </button>
        </section>
        <section>
          <button onFocus={() => (this.focusMsg = 'Has Focus')} class="focus">
            {this.focusMsg}
          </button>
        </section>
        <section>
          <button onClick={() => (this.tapMsg = 'Was Tapped')} class="tap">
            {this.tapMsg}
          </button>
        </section>
        <section>
          <input class="input" />
        </section>
      </div>
    );
  }
}

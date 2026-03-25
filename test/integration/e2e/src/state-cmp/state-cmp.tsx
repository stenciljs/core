import { Component, State, h } from '@stencil/core';

@Component({
  tag: 'state-cmp',
  styles: `
    button {
      color: black;
    }
    .selected {
      font-weight: bold;
      color: blue;
    }
  `,
  shadow: true,
})
export class StateCmp {
  @State() selected: string;

  days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  dayClicked(day: string) {
    this.selected = day;
  }

  render() {
    return (
      <section>
        <label>What is your favorite day?</label>
        <div>
          {this.days.map((day) => (
            <button class={day === this.selected ? 'selected' : ''} onClick={() => this.dayClicked(day)} key={day}>
              {day}
            </button>
          ))}
        </div>
      </section>
    );
  }
}

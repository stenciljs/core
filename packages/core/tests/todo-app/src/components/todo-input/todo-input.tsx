import { Component, State, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'todo-input',
})
export class TodoInput {
  @Event() inputSubmit: EventEmitter;
  @State() value: string;

  render() {
    const value = this.value;
    return (
      <form
        onSubmit={(ev) => {
          if (value) {
            ev.preventDefault();
            this.inputSubmit.emit(value);
            this.value = '';
          }
        }}
      >
        <input
          class="new-todo"
          value={value}
          type="text"
          placeholder="What needs to be done?"
          onInput={(ev: any) => (this.value = ev.target.value)}
        />
      </form>
    );
  }
}

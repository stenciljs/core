import { Component, State, h } from '@stencil/core';

@Component({
  tag: 'app-root',
})
export class AppRoot {
  @State() list: TodoItem[] = [];

  render() {
    const list = this.list;
    const allChecked = list.every((item) => item.checked);
    return (
      <div>
        <header class="header">
          <h1>Todos Stencil</h1>
          <todo-input
            onInputSubmit={(e: CustomEvent) => {
              this.list = [...list, { text: e.detail }];
            }}
          ></todo-input>
        </header>
        <section class="main" hidden={!list.length}>
          <input
            id="toggle-all"
            onInput={(e: InputEvent) => {
              this.list = list.map((item) => {
                item.checked = !!(e.target as HTMLInputElement).checked;
                return item;
              });
            }}
            class="toggle-all"
            type="checkbox"
            checked={allChecked}
          />
          <label htmlFor="toggle-all" />
          <ul class="todo-list">
            {list.map((item, index) => (
              <todo-item
                onItemCheck={() => {
                  list[index] = Object.assign({}, item, { checked: !item.checked });
                  this.list = list.slice();
                }}
                onItemRemove={() => {
                  this.list = [...list.slice(0, index), ...list.slice(index + 1)];
                }}
                checked={item.checked}
                text={item.text}
              />
            ))}
          </ul>
        </section>
      </div>
    );
  }
}

interface TodoItem {
  text: string;
  checked?: boolean;
}

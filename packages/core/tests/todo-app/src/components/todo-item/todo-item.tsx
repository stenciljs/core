import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'todo-item',
})
export class TodoItem {
  @Prop({ attribute: null }) checked: boolean;
  @Prop({ attribute: null }) text: string;
  @Event() itemCheck: EventEmitter;
  @Event() itemRemove: EventEmitter;

  render() {
    const { checked, text, itemCheck, itemRemove } = this;
    return (
      <li class={{ completed: checked }}>
        <input class="toggle" type="checkbox" checked={checked} onChange={() => itemCheck.emit()} />
        <label>{text}</label>
        <button class="destroy" onClick={() => itemRemove.emit()}></button>
      </li>
    );
  }
}

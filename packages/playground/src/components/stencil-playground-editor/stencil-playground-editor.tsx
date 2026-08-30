import { Component, Event, h, Prop } from '@stencil/core';
import type { EventEmitter } from '@stencil/core';

@Component({
  tag: 'stencil-playground-editor',
  styleUrl: 'stencil-playground-editor.css',
  encapsulation: { type: 'shadow' },
})
export class StencilPlaygroundEditor {
  @Prop() value = '';

  @Event() valueChange!: EventEmitter<string>;

  private onInput = (ev: InputEvent) => {
    this.valueChange.emit((ev.target as HTMLTextAreaElement).value);
  };

  render() {
    return (
      <textarea
        spellcheck={false}
        autocapitalize='off'
        autocorrect='off'
        wrap='off'
        value={this.value}
        onInput={this.onInput}
      />
    );
  }
}

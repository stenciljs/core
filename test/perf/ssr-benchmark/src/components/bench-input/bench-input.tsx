import { Component, Event, EventEmitter, Host, Prop } from '@stencil/core';

let inputIds = 0;

@Component({
  tag: 'bench-input',
  styleUrl: 'bench-input.css',
  encapsulation: { type: 'scoped' },
})
export class BenchInput {
  @Prop() label: string;
  @Prop({ mutable: true }) value = '';
  @Prop() placeholder?: string;
  @Prop() type: 'text' | 'email' | 'password' = 'text';
  @Prop({ reflect: true }) required = false;
  @Prop() helperText?: string;
  @Event() benchInput: EventEmitter<string>;

  private inputId = `bench-input-${inputIds++}`;

  render() {
    return (
      <Host class={{ 'has-value': this.value.length > 0, 'input-required': this.required }}>
        <label class='input-wrapper' htmlFor={this.inputId}>
          <span class='label-text'>
            {this.label}
            {this.required && <span class='required-mark'>*</span>}
          </span>
          <span class='native-wrapper'>
            <slot name='start' />
            <input
              id={this.inputId}
              class='native-input'
              type={this.type}
              value={this.value}
              placeholder={this.placeholder}
              required={this.required}
            />
            <slot name='end' />
          </span>
        </label>
        {this.helperText && <div class='helper-text'>{this.helperText}</div>}
      </Host>
    );
  }
}

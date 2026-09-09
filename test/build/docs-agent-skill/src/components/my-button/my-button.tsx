import { Component, Event, EventEmitter, Prop } from '@stencil/core';

/**
 * A clickable button component.
 */
@Component({
  tag: 'my-button',
  encapsulation: { type: 'shadow' },
})
export class MyButton {
  /**
   * The button's visual style.
   */
  @Prop() variant: 'primary' | 'secondary' = 'primary';

  /**
   * Emitted when the button is clicked.
   */
  @Event() myButtonClick: EventEmitter<void>;

  private handleClick = () => {
    this.myButtonClick.emit();
  };

  render() {
    return (
      <button class={this.variant} onClick={this.handleClick}>
        <slot></slot>
      </button>
    );
  }
}

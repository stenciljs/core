import { Component, ComponentInterface, h, Host, Listen, State } from '@stencil/core';

@Component({
  tag: 'event-re-register',
  styleUrl: 'event-re-register.css',
  shadow: true,
})
export class EventReRegister implements ComponentInterface {
  @State() eventFiredTimes: number = 0;
  @Listen('keydown')
  handleKeydown(event: KeyboardEvent) {
    this.eventFiredTimes++;
    console.log(event);
  }

  connectedCallback() {
    console.log('connected');
  }
  disconnectedCallback() {
    console.log('disconnected');
  }
  render() {
    return (
      <Host tabindex="1">
        <ul id="reattach">
          <li>Focus this component;</li>
          <li>Press key;</li>
          <li>See console output</li>
          <li>Press 'Reconnect' button</li>
          <li>Repeat steps 1-3</li>
        </ul>
        <p>Event fired times: {this.eventFiredTimes}</p>
      </Host>
    );
  }
}

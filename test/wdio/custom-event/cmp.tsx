import { Component, Element, h, State } from '@stencil/core';

@Component({
  tag: 'custom-event-root',
})
export class CustomEventCmp {
  @Element() elm!: HTMLElement;

  @State() output = '';

  componentDidLoad() {
    this.elm.addEventListener('eventNoDetail', this.receiveEvent.bind(this));
    this.elm.addEventListener('eventWithDetail', this.receiveEvent.bind(this));
  }

  receiveEvent(ev: any) {
    this.output = `${ev.type} ${ev.detail || ''}`.trim();
  }

  fireCustomEventNoDetail() {
    const ev = new CustomEvent('eventNoDetail');
    this.elm.dispatchEvent(ev);
  }

  fireCustomEventWithDetail() {
    const ev = new CustomEvent('eventWithDetail', { detail: 88 });
    this.elm.dispatchEvent(ev);
  }

  render() {
    return (
      <div>
        <div>
          <button id="btnNoDetail" onClick={this.fireCustomEventNoDetail.bind(this)}>
            Fire Custom Event, no detail
          </button>
        </div>
        <div>
          <button id="btnWithDetail" onClick={this.fireCustomEventWithDetail.bind(this)}>
            Fire Custom Event, with detail
          </button>
        </div>
        <pre id="output">{this.output}</pre>
      </div>
    );
  }
}

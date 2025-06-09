import { Component, Event, EventEmitter, h, Listen, Method, Prop, State, Watch } from '@stencil/core';

import { format } from './utils';

@Component({
  tag: 'cmp-a',
  styleUrl: 'cmp-a.css',
  shadow: true,
})
export class CmpA {
  // ************************
  // * Property Definitions *
  // ************************

  /**
   * The first name
   */
  @Prop() first: string;

  /**
   * The middle name
   */
  @Prop() middle: string;

  /**
   * The last name
   */
  @Prop() last: string;

  // ************************
  // * State Definitions *
  // ************************

  @State() innerFirst: string;
  @State() innerMiddle: string;
  @State() innerLast: string;

  // *****************************
  // * Watch on Property Changes *
  // *****************************

  @Watch('first')
  parseFirstProp(newValue: string) {
    this.innerFirst = newValue ? newValue : '';
  }
  @Watch('middle')
  parseMiddleProp(newValue: string) {
    this.innerMiddle = newValue ? newValue : '';
  }
  @Watch('last')
  parseLastProp(newValue: string) {
    this.innerLast = newValue ? newValue : '';
  }

  // *********************
  // * Event Definitions *
  // *********************

  /**
   * Emitted when the component Loads
   */
  @Event() initevent: EventEmitter;

  // *******************************
  // * Listen to Event Definitions *
  // *******************************

  @Listen('testevent', { target: 'document' })
  handleTestEvent(event: CustomEvent) {
    this.parseLastProp(event.detail.last ? event.detail.last : '');
  }

  // **********************
  // * Method Definitions *
  // **********************

  @Method()
  init(): Promise<void> {
    return Promise.resolve(this._init());
  }

  // *********************************
  // * Internal Variable Definitions *
  // *********************************

  // *******************************
  // * Component Lifecycle Methods *
  // *******************************

  async componentWillLoad() {
    await this.init();
  }

  // ******************************
  // * Private Method Definitions *
  // ******************************

  private async _init(): Promise<void> {
    this.parseFirstProp(this.first ? this.first : '');
    this.parseMiddleProp(this.middle ? this.middle : '');
    this.parseLastProp(this.last ? this.last : '');
    this.initevent.emit({ init: true });
    return;
  }

  private getText(): string {
    return format(this.innerFirst, this.innerMiddle, this.innerLast);
  }

  // *************************
  // * Rendering JSX Element *
  // *************************

  render() {
    return <div>Hello, World! I'm {this.getText()}</div>;
  }
}

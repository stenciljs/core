import { Component, Element, Event, EventEmitter, h, Listen, Method, Prop, State } from '@stencil/core';

@Component({
  tag: 'component-on-ready',
  styleUrl: 'component-on-ready.css',
  shadow: true,
})
export class ComponentOnReady {
  @Element() el!: HTMLElement;

  @Prop() propVal = 0;

  @State() isReady = 'false';
  @State() stateVal?: string;
  @State() listenVal = 0;

  @Event() someEvent!: EventEmitter;

  @Listen('click')
  handleClick() {
    this.listenVal++;
  }

  @Method()
  async someMethod() {
    this.someEvent.emit();
  }

  componentWillLoad() {
    this.stateVal = 'mph';
    (this.el as any).componentOnReady().then(() => {
      this.isReady = 'true';
    });
  }

  componentDidLoad() {
    this.el.parentElement?.addEventListener('someEvent', () => {
      (this.el as any).propVal++;
    });
  }

  private handleButtonClick = () => {
    (this.el as any).someMethod();
  };

  render() {
    return (
      <div>
        <h1>component-on-ready</h1>
        <span>text color defined by :host</span>
        <p id="propVal">propVal: {this.propVal}</p>
        <p id="stateVal">stateVal: {this.stateVal}</p>
        <p id="listenVal">listenVal: {this.listenVal}</p>
        <p>
          <button onClick={this.handleButtonClick}>Test</button>
        </p>
        <p id="isReady">componentOnReady: {this.isReady}</p>
      </div>
    );
  }
}

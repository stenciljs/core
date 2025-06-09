import {
  AttachInternals as ElInternals,
  Component as Cmp,
  Element as El,
  Event as StencilEvent,
  EventEmitter,
  h,
  Listen as StencilListen,
  Method as StencilMethod,
  Prop as Input,
  State as StencilState,
  Watch as StencilWatch,
} from '@stencil/core';

@Cmp({
  tag: 'import-aliasing',
  formAssociated: true,
})
export class FormAssociatedCmp {
  @Input() user: string;

  @StencilEvent() myEvent: EventEmitter<void>;

  @El() el!: HTMLElement;

  @ElInternals()
  internals: ElementInternals;

  @StencilState() changeCount = 0;
  @StencilState() methodCalledCount = 0;
  @StencilState() eventCaughtCount = 0;

  @StencilListen('myEvent')
  onMyEventTriggered() {
    this.eventCaughtCount += 1;
  }

  @StencilWatch('user')
  onNameChange() {
    this.changeCount += 1;
  }

  @StencilMethod()
  async myMethod() {
    this.methodCalledCount += 1;
    this.myEvent.emit();

    return this.el;
  }

  componentWillLoad() {
    this.internals.setFormValue('my default value');
  }

  render() {
    return [
      <p>My name is {this.user}</p>,
      <p>Name changed {this.changeCount} time(s)</p>,
      <p>Method called {this.methodCalledCount} time(s)</p>,
      <p>Event triggered {this.eventCaughtCount} time(s)</p>,
    ];
  }
}

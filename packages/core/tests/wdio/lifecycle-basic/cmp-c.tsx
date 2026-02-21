import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'lifecycle-basic-c',
})
export class LifecycleBasicC {
  @Prop() value = '';
  @State() rendered = 0;

  @Event() lifecycleLoad!: EventEmitter;
  @Event() lifecycleUpdate!: EventEmitter;

  componentWillLoad() {
    this.lifecycleLoad.emit('componentWillLoad-c');
  }

  componentDidLoad() {
    this.lifecycleLoad.emit('componentDidLoad-c');
  }

  componentWillUpdate() {
    this.lifecycleUpdate.emit('componentWillUpdate-c');
  }

  componentDidUpdate() {
    this.lifecycleUpdate.emit('componentDidUpdate-c');
  }

  render() {
    this.rendered++;

    return (
      <div>
        <hr />
        <div>LifecycleBasicC {this.value}</div>
        <div class="rendered-c">rendered c: {this.rendered}</div>
      </div>
    );
  }
}

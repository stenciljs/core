import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'lifecycle-basic-b',
})
export class LifecycleBasicB {
  @Prop() value = '';
  @State() rendered = 0;

  @Event() lifecycleLoad!: EventEmitter;
  @Event() lifecycleUpdate!: EventEmitter;

  componentWillLoad() {
    this.lifecycleLoad.emit('componentWillLoad-b');
  }

  componentDidLoad() {
    this.lifecycleLoad.emit('componentDidLoad-b');
  }

  componentWillUpdate() {
    this.lifecycleUpdate.emit('componentWillUpdate-b');
  }

  componentDidUpdate() {
    this.lifecycleUpdate.emit('componentDidUpdate-b');
  }

  render() {
    this.rendered++;

    return (
      <div>
        <hr />
        <div>LifecycleBasicB {this.value}</div>
        <div class="rendered-b">rendered b: {this.rendered}</div>
        <lifecycle-basic-c value={this.value} />
      </div>
    );
  }
}

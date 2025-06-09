import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';

import { timeout } from './util';

@Component({
  tag: 'lifecycle-async-c',
})
export class LifecycleAsyncC {
  @Prop() value = '';
  rendered = 0;

  @Event() lifecycleLoad!: EventEmitter;
  @Event() lifecycleUpdate!: EventEmitter;

  async componentWillLoad() {
    this.lifecycleLoad.emit('componentWillLoad-c');
  }

  async componentDidLoad() {
    this.lifecycleLoad.emit('componentDidLoad-c');
  }

  async componentWillUpdate() {
    this.lifecycleUpdate.emit('componentWillUpdate-c');
    await timeout(100);
  }

  async componentDidUpdate() {
    this.lifecycleUpdate.emit('componentDidUpdate-c');
    await timeout(100);
  }

  render() {
    this.rendered++;

    return (
      <div>
        <hr />
        <div>LifecycleAsyncC {this.value}</div>
        <div class="rendered-c">rendered c: {this.rendered}</div>
      </div>
    );
  }
}

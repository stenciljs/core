import { Component, h, Listen, State } from '@stencil/core';

@Component({
  tag: 'lifecycle-async-a',
})
export class LifecycleAsyncA {
  @State() value = '';
  @State() loads: string[] = [];
  @State() updates: string[] = [];
  rendered = 0;
  componentWillUpdated = false;
  componentDidUpdated = false;

  @Listen('lifecycleLoad')
  lifecycleLoad(ev: any) {
    this.loads = [...this.loads, ev.detail];
  }

  @Listen('lifecycleUpdate')
  lifecycleUpdate(ev: any) {
    this.updates = [...this.updates, ev.detail];
  }

  async componentWillLoad() {
    this.loads = [...this.loads, 'componentWillLoad-a'];
  }

  async componentDidLoad() {
    this.loads = [...this.loads, 'componentDidLoad-a'];
  }

  async componentWillUpdate() {
    if (this.value === 'Updated' && !this.componentWillUpdated) {
      this.updates = [...this.updates, 'componentWillUpdate-a'];
      this.componentWillUpdated = true;
    }
  }

  async componentDidUpdate() {
    if (this.value === 'Updated' && !this.componentDidUpdated) {
      this.updates = [...this.updates, 'componentDidUpdate-a'];
      this.componentDidUpdated = true;
    }
  }

  testClick() {
    this.value = 'Updated';
  }

  render() {
    this.rendered++;

    return (
      <div>
        <button onClick={this.testClick.bind(this)} class="test">
          Update
        </button>
        <hr />
        <div>LifecycleAsyncA {this.value}</div>
        <div class="rendered-a">rendered a: {this.rendered}</div>
        <div>loads a:</div>
        <ol class="lifecycle-loads-a">
          {this.loads.map((load) => {
            return <li>{load}</li>;
          })}
        </ol>
        <div>updates a:</div>
        <ol class="lifecycle-updates-a">
          {this.updates.map((update) => {
            return <li>{update}</li>;
          })}
        </ol>
        <lifecycle-async-b value={this.value} />
      </div>
    );
  }
}

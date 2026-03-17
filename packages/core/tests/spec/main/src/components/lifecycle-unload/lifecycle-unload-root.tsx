import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'lifecycle-unload-root',
})
export class LifecycleUnloadRoot {
  @State() renderCmp = true;

  testClick() {
    this.renderCmp = !this.renderCmp;
  }

  render() {
    return (
      <div>
        <button onClick={this.testClick.bind(this)}>{this.renderCmp ? 'Remove' : 'Add'}</button>
        {this.renderCmp ? <lifecycle-unload-a></lifecycle-unload-a> : null}
      </div>
    );
  }
}

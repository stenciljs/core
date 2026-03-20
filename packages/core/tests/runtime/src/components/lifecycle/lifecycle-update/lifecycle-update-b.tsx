import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'lifecycle-update-b',
})
export class LifecycleUpdateB {
  @Prop() value = 0;
  start?: number;

  componentWillLoad() {
    this.start = Date.now();

    const li = document.createElement('li');
    li.innerHTML = `<span style="color:red">lifecycle-update-b</span> <span style="color:blue">componentWillLoad</span> ${this.value}`;
    document.getElementById('output')!.appendChild(li);

    return new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }

  componentDidLoad() {
    const li = document.createElement('li');
    li.innerHTML = `<span style="color:red">lifecycle-update-b</span> <span style="color:green">componentDidLoad</span> ${this.value}`;
    document.getElementById('output')!.appendChild(li);
  }

  render() {
    return (
      <section>
        lifecycle-update-b: {this.value}
        <lifecycle-update-c value={this.value}></lifecycle-update-c>
      </section>
    );
  }
}

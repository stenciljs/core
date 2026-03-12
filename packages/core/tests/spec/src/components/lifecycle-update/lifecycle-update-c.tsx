import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'lifecycle-update-c',
})
export class LifecycleUpdateC {
  @Prop() value = 0;
  start?: number;

  componentWillLoad() {
    this.start = Date.now();

    const li = document.createElement('li');
    li.innerHTML = `<span style="color:orange">lifecycle-update-c</span> <span style="color:blue">componentWillLoad</span> ${this.value}`;
    document.getElementById('output')!.appendChild(li);

    return new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
  }

  componentDidLoad() {
    const li = document.createElement('li');
    li.innerHTML = `<span style="color:orange">lifecycle-update-c</span> <span style="color:green">componentDidLoad</span> ${this.value}`;
    document.getElementById('output')!.appendChild(li);
  }

  render() {
    return <span> - lifecycle-update-c: {this.value}</span>;
  }
}

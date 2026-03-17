import { Component, h, State } from '@stencil/core';

@Component({
  tag: 'lifecycle-update-a',
})
export class LifecycleUpdateA {
  @State() values: number[] = [];

  testClick() {
    this.values.push(this.values.length + 1);
    this.values = this.values.slice();

    const li = document.createElement('li');
    li.innerHTML = `<span style="color:gray">async add child components to lifecycle-update-a</span> ${
      this.values[this.values.length - 1]
    }`;
    document.getElementById('output')!.appendChild(li);
  }

  componentWillLoad() {
    const li = document.createElement('li');
    li.innerHTML = `<span style="color:maroon">lifecycle-update-a</span> <span style="color:blue">componentWillLoad</span>`;
    document.getElementById('output')!.appendChild(li);

    return new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  }

  componentDidLoad() {
    const li = document.createElement('li');
    li.innerHTML = `<span style="color:maroon">lifecycle-update-a</span> <span style="color:green">componentDidLoad</span>`;
    document.getElementById('output')!.appendChild(li);
  }

  componentWillUpdate() {
    const li = document.createElement('li');
    li.innerHTML = `<span style="color:maroon">lifecycle-update-a</span> <span style="color:cyan">componentWillUpdate</span> ${
      this.values[this.values.length - 1]
    }`;
    document.getElementById('output')!.appendChild(li);
  }

  componentDidUpdate() {
    const li = document.createElement('li');
    li.innerHTML = `<span style="color:maroon">lifecycle-update-a</span> <span style="color:limegreen">componentDidUpdate</span> ${
      this.values[this.values.length - 1]
    }`;
    document.getElementById('output')!.appendChild(li);
  }

  render() {
    return (
      <div>
        <button onClick={this.testClick.bind(this)} class="test">
          Add Child Components
        </button>
        <hr />
        {this.values.map((value) => {
          return <lifecycle-update-b value={value}></lifecycle-update-b>;
        })}
      </div>
    );
  }
}

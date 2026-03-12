import { Component, Element, h } from '@stencil/core';

@Component({
  tag: 'lifecycle-unload-a',
  shadow: true,
})
export class LifecycleUnloadA {
  @Element() el!: HTMLElement;
  results?: HTMLDivElement | null;

  componentDidLoad() {
    this.results = this.el.ownerDocument!.body.querySelector('#lifecycle-unload-results') as HTMLDivElement;
  }

  disconnectedCallback() {
    const elm = document.createElement('div');
    elm.textContent = 'cmp-a unload';
    this.results!.appendChild(elm);
  }

  render() {
    return (
      <main>
        <header>cmp-a - top</header>
        <lifecycle-unload-b>cmp-a - middle</lifecycle-unload-b>
        <footer>cmp-a - bottom</footer>
      </main>
    );
  }
}

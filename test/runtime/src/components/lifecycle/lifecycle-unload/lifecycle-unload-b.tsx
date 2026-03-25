import { Component, Element, h } from '@stencil/core';

@Component({
  tag: 'lifecycle-unload-b',
  shadow: true,
})
export class LifecycleUnloadB {
  @Element() el!: HTMLElement;
  results?: HTMLDivElement;

  componentDidLoad() {
    this.results = this.el.ownerDocument!.body.querySelector('#lifecycle-unload-results') as HTMLDivElement;
  }

  disconnectedCallback() {
    const elm = document.createElement('div');
    elm.textContent = 'cmp-b unload';
    this.results!.appendChild(elm);
  }

  render() {
    return [
      <article>cmp-b - top</article>,
      <section>
        <slot />
      </section>,
      <nav>cmp-b - bottom</nav>,
    ];
  }
}

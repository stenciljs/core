import { Component, Element, h } from '@stencil/core';

@Component({
  tag: 'clone-node-root',
})
export class CloneNodeRoot {
  @Element() el!: HTMLElement;

  cloneSlides() {
    this.el.querySelectorAll('clone-node-slide').forEach((slide) => {
      const clonedSlide = slide.cloneNode(true) as HTMLElement;
      this.el.appendChild(clonedSlide);
    });
  }

  render() {
    return (
      <div>
        <button onClick={this.cloneSlides.bind(this)}>Clone Slides</button>
        <clone-node-slide>
          <clone-node-text></clone-node-text>
        </clone-node-slide>
      </div>
    );
  }
}

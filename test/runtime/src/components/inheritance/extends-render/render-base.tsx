import { h } from '@stencil/core';

export class RenderBase {
  protected baseTitle: string = 'Base Component';
  protected baseClass: string = 'base-container';

  render() {
    return (
      <div class={this.baseClass}>
        <header class='base-header'>
          <h1 class='base-title'>{this.baseTitle}</h1>
        </header>
        <main class='base-content'>
          <slot name='content' />
          <slot />
        </main>
        <footer class='base-footer'>
          <p class='base-footer-text'>Base footer content</p>
        </footer>
      </div>
    );
  }
}

import { h } from '@stencil/core';

/**
 * Base class with render() method for inheritance testing.
 * Tests that components can inherit and extend render methods using super.render().
 */
export class RenderBase {
  // Base class state/props that child can access
  protected baseTitle: string = 'Base Component';
  protected baseClass: string = 'base-container';

  /**
   * Base render method that includes:
   * - Template structure with slots
   * - CSS classes
   * - Base content
   */
  render() {
    return (
      <div class={this.baseClass}>
        <header class="base-header">
          <h1 class="base-title">{this.baseTitle}</h1>
        </header>
        <main class="base-content">
          <slot name="content" />
          <slot />
        </main>
        <footer class="base-footer">
          <p class="base-footer-text">Base footer content</p>
        </footer>
      </div>
    );
  }
}


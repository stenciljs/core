import { Component, Host, Prop } from '@stencil/core';

@Component({
  tag: 'bench-app',
  styleUrl: 'bench-app.css',
  encapsulation: { type: 'shadow' },
})
export class BenchApp {
  @Prop({ reflect: true }) theme: 'light' | 'dark' = 'light';

  render() {
    return (
      <Host class={{ [`theme-${this.theme}`]: true }}>
        <header class='app-header'>
          <slot name='header' />
        </header>
        <main class='app-content'>
          <slot />
        </main>
      </Host>
    );
  }
}

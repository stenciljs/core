declare module '@stencil/core/internal' {
  export interface HTMLStencilElement extends Omit<HTMLElement, 'autocorrect'> {
    this: this;
    autocorrect: 'on' | 'off'
  }
}
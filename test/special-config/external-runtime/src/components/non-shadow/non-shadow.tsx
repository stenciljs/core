import { AttachInternals, Component, Env } from '@stencil/core';

@Component({
  tag: 'non-shadow',
})
export class NonShadow {
  render() {
    return (
      <div>
        Some internal stuff
        <slot />
      </div>
    );
  }
}

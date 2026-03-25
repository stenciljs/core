import { Build, Component, h, Host } from '@stencil/core';

@Component({
  tag: 'build-data',
})
export class BuildData {
  render() {
    return (
      <Host>
        <p class="is-dev">isDev: {`${Build.isDev}`}</p>
        <p class="is-browser">isBrowser: {`${Build.isBrowser}`}</p>
        <p class="is-testing">isTesting: {`${Build.isTesting}`}</p>
      </Host>
    );
  }
}

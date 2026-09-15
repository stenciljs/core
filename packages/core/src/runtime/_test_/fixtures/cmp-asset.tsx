import { Component, getAssetPath, h, Host, Prop } from '@stencil/core';

@Component({
  tag: 'cmp-asset',
})
export class CmpAsset {
  @Prop() icon: string;

  render() {
    return (
      <Host>
        <img src={getAssetPath(`assets/icons/${this.icon}.png`)} />
        <img src={getAssetPath(`https://google.com/`)} />
      </Host>
    );
  }
}

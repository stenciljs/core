import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'slot-replace-wrapper',
})
export class SlotReplaceWrapper {
  @Prop() href?: string;

  render() {
    const TagType = (this.href != null ? 'a' : 'div') as any;
    const attrs = (this.href != null ? { href: this.href, target: '_blank' } : {}) as any;

    return [
      <TagType {...attrs}>
        <slot name="start" />
        <span>
          <slot />
          <span>
            <slot name="end" />
          </span>
        </span>
      </TagType>,
      <hr />,
    ];
  }
}

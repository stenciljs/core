import { AttrDeserialize, Build, Component, Prop, PropSerialize, h } from '@stencil/core';

/** A complex prop that serializes itself to its attribute on the server, and reads it back. */
@Component({
  tag: 'ssr-prop-serialized-cmp',
  encapsulation: { type: 'shadow' },
})
export class SsrPropSerializedCmp {
  @Prop() items: string[] = [];

  @PropSerialize('items')
  serializeItems(value: string[]) {
    return Build.isBrowser ? null : JSON.stringify(value);
  }

  @AttrDeserialize('items')
  deserializeItems(value: string) {
    return JSON.parse(value);
  }

  componentWillLoad() {
    if (Build.isBrowser) {
      (window as any).__firstItems = [...this.items];
    }
  }

  render() {
    return (
      <ul>
        {this.items.map((item) => (
          <li>{item}</li>
        ))}
      </ul>
    );
  }
}

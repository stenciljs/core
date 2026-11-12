import { Build, Component, Prop, h } from '@stencil/core';

/** `@Prop({ serialize: 'json' })`: the generated JSON serializer pair carries the prop to the browser. */
@Component({
  tag: 'ssr-prop-json-cmp',
  encapsulation: { type: 'shadow' },
})
export class SsrPropJsonCmp {
  @Prop({ serialize: 'json' }) items: string[] = ['default'];

  componentWillLoad() {
    if (Build.isBrowser) {
      (window as any).__jsonFirstItems = [...this.items];
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

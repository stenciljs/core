import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'complex-properties',
  shadow: true,
})
export class ComplexProperties {
  /**
   * basic object
   */
  @Prop() foo: { bar: string; loo: number[]; qux: { quux: symbol } };

  /**
   * map objects
   */
  @Prop() baz: Map<string, { qux: symbol }>;

  /**
   * set objects
   */
  @Prop() quux: Set<string>;

  /**
   * infinity
   */
  @Prop() grault: typeof Infinity;

  /**
   * null
   */
  @Prop() waldo: null;

  /**
   * basic array
   */
  @Prop() kidsNames: any;

  render() {
    return (
      <ul>
        <li>
          {`this.foo.bar`}: {this.foo.bar}
        </li>
        <li>
          {`this.foo.loo`}: {this.foo.loo.join(', ')}
        </li>
        <li>
          {`this.foo.qux`}: {typeof this.foo.qux.quux}
        </li>
        <li>
          {`this.baz.get('foo')`}: {typeof this.baz.get('foo')?.qux}
        </li>
        <li>
          {`this.quux.has('foo')`}: {this.quux.has('foo') ? 'true' : 'false'}
        </li>
        <li>
          {`this.grault`}: {this.grault === Infinity ? 'true' : 'false'}
        </li>
        <li>
          {`this.waldo`}: {this.waldo === null ? 'true' : 'false'}
        </li>
        <li>
          {`this.kidsNames`}: {this.kidsNames?.join(', ')}
        </li>
      </ul>
    );
  }
}

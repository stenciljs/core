import { AttrDeserialize, Component, Prop } from '@stencil/core';

/**
 * Deserialize extended JSON format that supports Map, Set, Symbol, Infinity, etc.
 */
function deserializeExtendedJSON(value: string): any {
  try {
    return JSON.parse(value, (_key, val) => {
      if (val && typeof val === 'object' && '__type' in val) {
        switch (val.__type) {
          case 'Map':
            return new Map(val.value.map(([k, v]: [any, any]) => [k, deserializeValue(v)]));
          case 'Set':
            return new Set(val.value.map((v: any) => deserializeValue(v)));
          case 'Symbol':
            return Symbol(val.value);
          case 'Infinity':
            return Infinity;
          default:
            return val;
        }
      }
      return val;
    });
  } catch {
    return value;
  }
}

function deserializeValue(val: any): any {
  if (val && typeof val === 'object' && '__type' in val) {
    switch (val.__type) {
      case 'Symbol':
        return Symbol(val.value);
      default:
        return val;
    }
  }
  return val;
}

@Component({
  tag: 'complex-properties',
  encapsulation: { type: 'shadow' },
})
export class ComplexProperties {
  /**
   * basic object
   */
  @Prop() foo: { bar: string; loo: number[]; qux: { quux: symbol } };
  @AttrDeserialize('foo')
  deserializeFoo(value: string) {
    return deserializeExtendedJSON(value);
  }

  /**
   * map objects
   */
  @Prop() baz: Map<string, { qux: symbol }>;
  @AttrDeserialize('baz')
  deserializeBaz(value: string) {
    return deserializeExtendedJSON(value);
  }

  /**
   * set objects
   */
  @Prop() quux: Set<string>;
  @AttrDeserialize('quux')
  deserializeQuux(value: string) {
    return deserializeExtendedJSON(value);
  }

  /**
   * infinity
   */
  @Prop() grault: typeof Infinity;
  @AttrDeserialize('grault')
  deserializeGrault(value: string) {
    return deserializeExtendedJSON(value);
  }

  /**
   * null
   */
  @Prop() waldo: null;
  @AttrDeserialize('waldo')
  deserializeWaldo(value: string) {
    return deserializeExtendedJSON(value);
  }

  /**
   * basic array
   */
  @Prop() kidsNames: any;
  @AttrDeserialize('kidsNames')
  deserializeKidsNames(value: string) {
    return deserializeExtendedJSON(value);
  }

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

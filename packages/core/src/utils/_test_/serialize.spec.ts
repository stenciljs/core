import { expect, describe, it } from '@stencil/vitest';
import { deserializeProperty, serializeProperty } from '../serialize';

describe('serialize', () => {
  it('should serialize and deserialize a simple object', () => {
    const toSerialize = { foo: 'bar' };
    expect(deserializeProperty(serializeProperty(toSerialize) as string)).toEqual(toSerialize);
  });

  it('should serialize and deserialize a simple array', () => {
    const toSerialize = [1, 2, 3];
    expect(deserializeProperty(serializeProperty(toSerialize) as string)).toEqual(toSerialize);
  });

  describe('should serialize and deserialize special number values', () => {
    const specialNumbers = [NaN, Infinity, -Infinity, -0];
    specialNumbers.forEach((num) => {
      it(`should serialize and deserialize ${num}`, () => {
        const serialized = serializeProperty(num) as string;
        const deserialized = deserializeProperty(serialized);
        if (Number.isNaN(num)) {
          expect(Number.isNaN(deserialized)).toBe(true);
        } else {
          expect(Object.is(deserialized, num)).toBe(true);
        }
      });
    });
  });

  it('should serialize and deserialize complex nested structures', () => {
    const date = new Date('2024-01-01');
    const regex = /test/gi;
    const toSerialize = {
      array: [1, 'two', { three: 3 }],
      date: date,
      regex: regex,
      nested: {
        map: new Map([['key', 'value']]),
        set: new Set([1, 2, 3]),
      },
    };

    const deserialized = deserializeProperty(serializeProperty(toSerialize) as string);

    expect(deserialized.array).toEqual([1, 'two', { three: 3 }]);
    expect(deserialized.date).toEqual(date);
    expect(deserialized.regex.source).toBe(regex.source);
    expect(deserialized.regex.flags).toBe(regex.flags);
    expect(deserialized.nested.map.get('key')).toBe('value');
    expect(Array.from(deserialized.nested.set)).toEqual([1, 2, 3]);
  });

  it('should serialize and deserialize Map with non-string keys', () => {
    const map = new Map([
      [1, 'number key'],
      [{ complex: 'key' }, 'object key'],
      ['string', 'string key'],
    ] as any);

    const deserialized = deserializeProperty(serializeProperty(map) as string);
    expect(deserialized.get(1)).toBe('number key');
    expect(deserialized.get('string')).toBe('string key');
    // Note: object keys will be serialized/deserialized but won't be strictly equal
    expect(Array.from(deserialized.entries()).length).toBe(3);
  });

  it('should serialize and deserialize Symbols', () => {
    const symbolKey = Symbol('test');
    const obj = {
      [symbolKey]: 'symbol value',
      regularKey: Symbol('another'),
    };

    const deserialized = deserializeProperty(serializeProperty(obj) as string);
    expect(deserialized.regularKey.description).toBe('another');
  });

  it('should handle null and undefined values', () => {
    const toSerialize: any = {
      nullValue: null,
      undefinedValue: undefined,
      nested: {
        nullValue: null,
        undefinedValue: undefined,
      },
    };

    const deserialized = deserializeProperty(serializeProperty(toSerialize) as string);
    expect(deserialized.nullValue).toBeNull();
    expect(deserialized.undefinedValue).toBeUndefined();
    expect(deserialized.nested.nullValue).toBeNull();
    expect(deserialized.nested.undefinedValue).toBeUndefined();
  });

  it('should serialize and deserialize BigInt values', () => {
    const toSerialize = {
      bigInt: BigInt('9007199254740991'),
      nested: {
        bigInt: BigInt('1234567890'),
      },
    };

    const deserialized = deserializeProperty(serializeProperty(toSerialize) as string);
    expect(deserialized.bigInt).toBe(BigInt('9007199254740991'));
    expect(deserialized.nested.bigInt).toBe(BigInt('1234567890'));
  });

  it('should handle circular references gracefully', () => {
    const circular: any = { foo: 'bar' };
    circular.self = circular;

    expect(() => serializeProperty(circular)).toThrow();
  });
});

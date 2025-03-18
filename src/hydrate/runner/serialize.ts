import type { ScriptListLocalValue, ScriptLocalValue, ScriptRegExpValue } from './types';

/**
 * Represents a primitive type.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-PrimitiveProtocolValue.
 */
export enum PrimitiveType {
  Undefined = 'undefined',
  Null = 'null',
  String = 'string',
  Number = 'number',
  SpecialNumber = 'number',
  Boolean = 'boolean',
  BigInt = 'bigint',
}

/**
 * Represents a non-primitive type.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-RemoteValue.
 */
export enum NonPrimitiveType {
  Array = 'array',
  Date = 'date',
  Map = 'map',
  Object = 'object',
  RegularExpression = 'regexp',
  Set = 'set',
  Channel = 'channel',
  Symbol = 'symbol',
}

export const TYPE_CONSTANT = 'type';
export const VALUE_CONSTANT = 'value';
export const SERIALIZED_PREFIX = 'serialized:';
const SERIALIZABLE_TYPES = ['string', 'boolean', 'undefined', 'number'];

type Serializeable = string | number | boolean | unknown;
type LocalValueParam = Serializeable | Serializeable[] | [Serializeable, Serializeable][];

/**
 * Serialize a value to a string that can be deserialized later.
 * @param {unknown} value - The value to serialize.
 * @returns {string} A string that can be deserialized later.
 */
export function serializeProperty(value: unknown) {
  /**
   * If the value is a primitive type, return it as is.
   */
  if (SERIALIZABLE_TYPES.includes(typeof value)) {
    return value
  }

  const arg = LocalValue.getArgument(value);
  return SERIALIZED_PREFIX + btoa(JSON.stringify(arg));
}

/**
 * Deserialize a value from a string that was serialized earlier.
 * @param {string} value - The string to deserialize.
 * @returns {unknown} The deserialized value.
 */
export function deserializeProperty(value: string) {
  if (!value.startsWith(SERIALIZED_PREFIX)) {
    return value;
  }
  return RemoteValue.fromLocalValue(JSON.parse(atob(value.slice(SERIALIZED_PREFIX.length))));
}

/**
 * Represents a local value with a specified type and optional value.
 * Described in https://w3c.github.io/webdriver-bidi/#type-script-LocalValue
 */
class LocalValue {
  type: PrimitiveType | NonPrimitiveType;
  value?: Serializeable | Serializeable[] | [Serializeable, Serializeable][];

  constructor(type: PrimitiveType | NonPrimitiveType, value?: LocalValueParam) {
    if (type === PrimitiveType.Undefined || type === PrimitiveType.Null) {
      this.type = type;
    } else {
      this.type = type;
      this.value = value;
    }
  }

  /**
   * Creates a new LocalValue object with a string value.
   *
   * @param {string} value - The string value to be stored in the LocalValue object.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createStringValue(value: string) {
    return new LocalValue(PrimitiveType.String, value);
  }

  /**
   * Creates a new LocalValue object with a number value.
   *
   * @param {number} value - The number value.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createNumberValue(value: number) {
    return new LocalValue(PrimitiveType.Number, value);
  }

  /**
   * Creates a new LocalValue object with a special number value.
   *
   * @param {number} value - The value of the special number.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createSpecialNumberValue(value: number) {
    if (Number.isNaN(value)) {
      return new LocalValue(PrimitiveType.SpecialNumber, 'NaN');
    }
    if (Object.is(value, -0)) {
      return new LocalValue(PrimitiveType.SpecialNumber, '-0');
    }
    if (value === Infinity) {
      return new LocalValue(PrimitiveType.SpecialNumber, 'Infinity');
    }
    if (value === -Infinity) {
      return new LocalValue(PrimitiveType.SpecialNumber, '-Infinity');
    }
    return new LocalValue(PrimitiveType.SpecialNumber, value);
  }

  /**
   * Creates a new LocalValue object with an undefined value.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createUndefinedValue() {
    return new LocalValue(PrimitiveType.Undefined);
  }

  /**
   * Creates a new LocalValue object with a null value.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createNullValue() {
    return new LocalValue(PrimitiveType.Null);
  }

  /**
   * Creates a new LocalValue object with a boolean value.
   *
   * @param {boolean} value - The boolean value.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createBooleanValue(value: boolean) {
    return new LocalValue(PrimitiveType.Boolean, value);
  }

  /**
   * Creates a new LocalValue object with a BigInt value.
   *
   * @param {BigInt} value - The BigInt value.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createBigIntValue(value: bigint) {
    return new LocalValue(PrimitiveType.BigInt, value);
  }

  /**
   * Creates a new LocalValue object with an array.
   *
   * @param {Array} value - The array.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createArrayValue(value: Array<unknown>) {
    return new LocalValue(NonPrimitiveType.Array, value);
  }

  /**
   * Creates a new LocalValue object with date value.
   *
   * @param {string} value - The date.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createDateValue(value: Date) {
    return new LocalValue(NonPrimitiveType.Date, value);
  }

  /**
   * Creates a new LocalValue object of map value.
   * @param {Map} map - The map.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createMapValue(map: Map<unknown, unknown>) {
    const value: [Serializeable, Serializeable][] = [];
    Array.from(map.entries()).forEach(([key, val]) => {
      value.push([LocalValue.getArgument(key), LocalValue.getArgument(val)]);
    });
    return new LocalValue(NonPrimitiveType.Map, value);
  }

  /**
   * Creates a new LocalValue object from the passed object.
   *
   * @param object the object to create a LocalValue from
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createObjectValue(object: Record<string | number | symbol, unknown>) {
    const value: [Serializeable, Serializeable][] = [];
    Object.entries(object).forEach(([key, val]) => {
      value.push([key, LocalValue.getArgument(val)]);
    });
    return new LocalValue(NonPrimitiveType.Object, value);
  }

  /**
   * Creates a new LocalValue object of regular expression value.
   *
   * @param {string} value - The value of the regular expression.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createRegularExpressionValue(value: { pattern: string; flags: string }) {
    return new LocalValue(NonPrimitiveType.RegularExpression, value);
  }

  /**
   * Creates a new LocalValue object with the specified value.
   * @param {Set} value - The value to be set.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createSetValue(value: ([unknown, unknown] | LocalValue)[]) {
    return new LocalValue(NonPrimitiveType.Set, value);
  }

  /**
   * Creates a new LocalValue object with the given channel value
   *
   * @param {ChannelValue} value - The channel value.
   * @returns {LocalValue} - The created LocalValue object.
   */
  static createChannelValue(value: unknown) {
    return new LocalValue(NonPrimitiveType.Channel, value);
  }

  /**
   * Creates a new LocalValue object with a Symbol value.
   *
   * @param {Symbol} symbol - The Symbol value
   * @returns {LocalValue} - The created LocalValue object
   */
  static createSymbolValue(symbol: Symbol) {
    // Store the symbol description or 'Symbol()' if undefined
    const description = symbol.description || 'Symbol()';
    return new LocalValue(NonPrimitiveType.Symbol, description);
  }

  static getArgument(argument: unknown) {
    const type = typeof argument;
    switch (type) {
      case PrimitiveType.String:
        return LocalValue.createStringValue(argument as string);
      case PrimitiveType.Number:
        if (Number.isNaN(argument) || Object.is(argument, -0) || !Number.isFinite(argument)) {
          return LocalValue.createSpecialNumberValue(argument as number);
        }

        return LocalValue.createNumberValue(argument as number);
      case PrimitiveType.Boolean:
        return LocalValue.createBooleanValue(argument as boolean);
      case PrimitiveType.BigInt:
        return LocalValue.createBigIntValue(argument as bigint);
      case PrimitiveType.Undefined:
        return LocalValue.createUndefinedValue();
      case NonPrimitiveType.Symbol:
        return LocalValue.createSymbolValue(argument as Symbol);
      case NonPrimitiveType.Object:
        if (argument === null) {
          return LocalValue.createNullValue();
        }
        if (argument instanceof Date) {
          return LocalValue.createDateValue(argument);
        }
        if (argument instanceof Map) {
          const map: ([unknown, unknown] | LocalValue)[] = [];

          argument.forEach((value, key) => {
            const objectKey = typeof key === 'string' ? key : LocalValue.getArgument(key);
            const objectValue = LocalValue.getArgument(value);
            map.push([objectKey, objectValue]);
          });
          return LocalValue.createMapValue(argument as Map<unknown, unknown>);
        }
        if (argument instanceof Set) {
          const set: LocalValue[] = [];
          argument.forEach((value) => {
            set.push(LocalValue.getArgument(value));
          });
          return LocalValue.createSetValue(set);
        }
        if (argument instanceof Array) {
          const arr: LocalValue[] = [];
          argument.forEach((value) => {
            arr.push(LocalValue.getArgument(value));
          });
          return LocalValue.createArrayValue(arr);
        }
        if (argument instanceof RegExp) {
          return LocalValue.createRegularExpressionValue({
            pattern: argument.source,
            flags: argument.flags,
          });
        }

        return LocalValue.createObjectValue(argument as Record<string | number | symbol, unknown>);
    }

    throw new Error(`Unsupported type: ${type}`);
  }

  asMap() {
    return {
      [TYPE_CONSTANT]: this.type,
      ...(!(this.type === PrimitiveType.Null || this.type === PrimitiveType.Undefined)
        ? { [VALUE_CONSTANT]: this.value }
        : {}),
    } as ScriptLocalValue;
  }
}

/**
 * RemoteValue class for deserializing LocalValue serialized objects back into their original form
 */
class RemoteValue {
  /**
   * Deserializes a LocalValue serialized object back to its original JavaScript representation
   *
   * @param serialized The serialized LocalValue object
   * @returns The original JavaScript value/object
   */
  static fromLocalValue(serialized: ScriptLocalValue): any {
    const type = serialized[TYPE_CONSTANT];
    const value = VALUE_CONSTANT in serialized ? serialized[VALUE_CONSTANT] : undefined;

    switch (type) {
      case PrimitiveType.String:
        return value;

      case PrimitiveType.Boolean:
        return value;

      case PrimitiveType.BigInt:
        return BigInt(value as string);

      case PrimitiveType.Undefined:
        return undefined;

      case PrimitiveType.Null:
        return null;

      case PrimitiveType.Number:
        if (value === 'NaN') return NaN;
        if (value === '-0') return -0;
        if (value === 'Infinity') return Infinity;
        if (value === '-Infinity') return -Infinity;
        return value;

      case NonPrimitiveType.Array:
        return (value as ScriptLocalValue[]).map((item: ScriptLocalValue) => RemoteValue.fromLocalValue(item));

      case NonPrimitiveType.Date:
        return new Date(value as string);

      case NonPrimitiveType.Map:
        const map = new Map();
        for (const [key, val] of value as unknown as [string, ScriptLocalValue][]) {
          const deserializedKey = typeof key === 'object' && key !== null ? RemoteValue.fromLocalValue(key) : key;
          const deserializedValue = RemoteValue.fromLocalValue(val);
          map.set(deserializedKey, deserializedValue);
        }
        return map;

      case NonPrimitiveType.Object:
        const obj: Record<string, any> = {};
        for (const [key, val] of value as unknown as [string, ScriptLocalValue][]) {
          obj[key] = RemoteValue.fromLocalValue(val);
        }
        return obj;

      case NonPrimitiveType.RegularExpression:
        const { pattern, flags } = value as ScriptRegExpValue;
        return new RegExp(pattern, flags);

      case NonPrimitiveType.Set:
        const set = new Set();
        for (const item of value as unknown as ScriptListLocalValue) {
          set.add(RemoteValue.fromLocalValue(item));
        }
        return set;

      case NonPrimitiveType.Symbol:
        return Symbol(value as string);

      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }

  /**
   * Utility method to deserialize multiple LocalValues at once
   *
   * @param serializedValues Array of serialized LocalValue objects
   * @returns Array of deserialized JavaScript values
   */
  static fromLocalValueArray(serializedValues: ScriptLocalValue[]): any[] {
    return serializedValues.map((value) => RemoteValue.fromLocalValue(value));
  }

  /**
   * Verifies if the given object matches the structure of a serialized LocalValue
   *
   * @param obj Object to verify
   * @returns boolean indicating if the object has LocalValue structure
   */
  static isLocalValueObject(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    if (!obj.hasOwnProperty(TYPE_CONSTANT)) {
      return false;
    }

    const type = obj[TYPE_CONSTANT];
    const hasTypeProperty = Object.values({ ...PrimitiveType, ...NonPrimitiveType }).includes(type);

    if (!hasTypeProperty) {
      return false;
    }

    if (type !== PrimitiveType.Null && type !== PrimitiveType.Undefined) {
      return obj.hasOwnProperty(VALUE_CONSTANT);
    }

    return true;
  }
}

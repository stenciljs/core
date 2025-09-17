import { NonPrimitiveType, PrimitiveType, TYPE_CONSTANT, VALUE_CONSTANT } from './constants';
import type { ScriptListLocalValue, ScriptLocalValue, ScriptRegExpValue } from './types';

/**
 * RemoteValue class for deserializing LocalValue serialized objects back into their original form
 * @deprecated will be removed in v5. Use `@AttrDeserialize()` / `@PropDeserialize()` decorators instead.
 */
export class RemoteValue {
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

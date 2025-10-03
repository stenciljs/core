import { SERIALIZED_PREFIX } from './constants';
import { LocalValue } from './local-value';
import { RemoteValue } from './remote-value';

/**
 * Serialize a value to a string that can be deserialized later.
 * @param {unknown} value - The value to serialize.
 * @returns {string} A string that can be deserialized later.
 * @deprecated will be removed in v5. Use `@PropSerialize()` decorator instead.
 */
export function serializeProperty(value: unknown) {
  /**
   * If the value is a primitive type, return it as is.
   */
  if (
    ['string', 'boolean', 'undefined'].includes(typeof value) ||
    (typeof value === 'number' && value !== Infinity && value !== -Infinity && !isNaN(value))
  ) {
    return value as string | number | boolean;
  }

  const arg = LocalValue.getArgument(value);
  return (SERIALIZED_PREFIX + btoa(JSON.stringify(arg))) as string;
}

/**
 * Deserialize a value from a string that was serialized earlier.
 * @param {string} value - The string to deserialize.
 * @returns {unknown} The deserialized value.
 * @deprecated will be removed in v5. Use `@AttrDeserialize()` decorator instead.
 */
export function deserializeProperty(value: string) {
  if (typeof value !== 'string' || !value.startsWith(SERIALIZED_PREFIX)) {
    return value;
  }
  return RemoteValue.fromLocalValue(JSON.parse(atob(value.slice(SERIALIZED_PREFIX.length))));
}

import { SERIALIZED_PREFIX } from './constants';
import { LocalValue } from './local-value';
import { RemoteValue } from './remote-value';

/**
 * Unicode-safe base64 encoding that handles characters outside Latin1 range.
 * Unlike btoa(), this properly handles Unicode characters including emoji,
 * CJK characters, and currency symbols like €.
 * @param {string} str - The string to encode.
 * @returns {string} Base64 encoded string.
 */
function encodeBase64Unicode(str: string): string {
  // First encode to UTF-8, then convert to base64
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary);
}

/**
 * Unicode-safe base64 decoding that handles characters outside Latin1 range.
 * Unlike atob(), this properly decodes Unicode characters including emoji,
 * CJK characters, and currency symbols like €.
 * @param {string} base64 - The base64 string to decode.
 * @returns {string} Decoded string.
 */
function decodeBase64Unicode(base64: string): string {
  // First decode from base64, then convert from UTF-8
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

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
  return (SERIALIZED_PREFIX + encodeBase64Unicode(JSON.stringify(arg))) as string;
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
  return RemoteValue.fromLocalValue(JSON.parse(decodeBase64Unicode(value.slice(SERIALIZED_PREFIX.length))));
}

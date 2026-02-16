import { MEMBER_FLAGS } from '../../utils';
import { parsePropertyValue } from '../parse-property-value';

describe('parse-property-value', () => {
  describe('parsePropertyValue', () => {
    describe('boolean coercion', () => {
      it('coerces the string "false" to boolean false', () => {
        const result = parsePropertyValue('false', MEMBER_FLAGS.Boolean);
        expect(result).toBe(false);
      });

      it('coerces the string "False" to boolean true', () => {
        const result = parsePropertyValue('False', MEMBER_FLAGS.Boolean);
        expect(result).toBe(true);
      });

      it('coerces an empty string to boolean true', () => {
        const result = parsePropertyValue('', MEMBER_FLAGS.Boolean);
        expect(result).toBe(true);
      });

      it('coerces the string "true" to boolean true', () => {
        const result = parsePropertyValue('true', MEMBER_FLAGS.Boolean);
        expect(result).toBe(true);
      });

      it('coerces the number 0 to boolean false', () => {
        const result = parsePropertyValue(0, MEMBER_FLAGS.Boolean);
        expect(result).toBe(false);
      });

      it('coerces the string "0" to boolean true', () => {
        const result = parsePropertyValue('0', MEMBER_FLAGS.Boolean);
        expect(result).toBe(true);
      });

      it('coerces the number 1 to boolean true', () => {
        const result = parsePropertyValue(1, MEMBER_FLAGS.Boolean);
        expect(result).toBe(true);
      });

      it('coerces the string "1" to boolean true', () => {
        const result = parsePropertyValue('1', MEMBER_FLAGS.Boolean);
        expect(result).toBe(true);
      });

      it('does not coerce null to boolean', () => {
        const result = parsePropertyValue(null, MEMBER_FLAGS.Boolean);
        expect(result).toBe(null);
      });

      it('coerces the string "null" to boolean true', () => {
        const result = parsePropertyValue('null', MEMBER_FLAGS.Boolean);
        expect(result).toBe(true);
      });

      it('does not coerce undefined to boolean', () => {
        const result = parsePropertyValue(undefined, MEMBER_FLAGS.Boolean);
        expect(result).toBe(undefined);
      });

      it('coerces the string "undefined" to boolean true', () => {
        const result = parsePropertyValue('undefined', MEMBER_FLAGS.Boolean);
        expect(result).toBe(true);
      });

      it('coerces NaN to boolean false', () => {
        const result = parsePropertyValue(NaN, MEMBER_FLAGS.Boolean);
        expect(result).toBe(false);
      });

      it('coerces the string "NaN" to boolean true', () => {
        const result = parsePropertyValue('NaN', MEMBER_FLAGS.Boolean);
        expect(result).toBe(true);
      });

      it('does not coerce a function to a boolean', () => {
        const noOpFunction = () => false;
        const result = parsePropertyValue(noOpFunction, MEMBER_FLAGS.Boolean);
        expect(result).toBe(noOpFunction);
      });
    });

    describe('number coercion', () => {
      it('coerces a number value to a number', () => {
        const result = parsePropertyValue(42, MEMBER_FLAGS.Number);
        expect(result).toBe(42);
      });

      it('coerces a stringified value to a number', () => {
        const result = parsePropertyValue('42', MEMBER_FLAGS.Number);
        expect(result).toBe(42);
      });

      it('coerces a float value to a number', () => {
        const result = parsePropertyValue('4.2', MEMBER_FLAGS.Number);
        expect(result).toBe(4.2);
      });

      it('coerces a positive value to a number', () => {
        const result = parsePropertyValue('+4.2', MEMBER_FLAGS.Number);
        expect(result).toBe(4.2);
      });

      it('coerces a negative value to a number', () => {
        const result = parsePropertyValue('-4.2', MEMBER_FLAGS.Number);
        expect(result).toBe(-4.2);
      });

      it('coerces a stringified scientific value to a number', () => {
        const result = parsePropertyValue('42e1', MEMBER_FLAGS.Number);
        expect(result).toBe(420);
      });

      it('returns NaN when parsing a boolean', () => {
        const result = parsePropertyValue(true, MEMBER_FLAGS.Number);
        expect(result).toBe(NaN);
      });

      it('returns NaN when parsing a string', () => {
        const result = parsePropertyValue('hello world', MEMBER_FLAGS.Number);
        expect(result).toBe(NaN);
      });

      it('returns an object prop unchanged', () => {
        const originalProp = { hello: 'world' };
        const result = parsePropertyValue(originalProp, MEMBER_FLAGS.Number);
        expect(result).toBe(originalProp);
      });

      it('returns an undefined prop unchanged', () => {
        const result = parsePropertyValue(undefined, MEMBER_FLAGS.Number);
        expect(result).toBe(undefined);
      });

      it('returns a null prop unchanged', () => {
        const result = parsePropertyValue(null, MEMBER_FLAGS.Number);
        expect(result).toBe(null);
      });

      it('returns NaN when NaN is received', () => {
        const result = parsePropertyValue(NaN, MEMBER_FLAGS.Number);
        expect(result).toBe(NaN);
      });

      it('does not coerce a function to a number', () => {
        const noOpFunction = () => 23;
        const result = parsePropertyValue(noOpFunction, MEMBER_FLAGS.Number);
        expect(result).toBe(noOpFunction);
      });
    });

    describe('string coercion', () => {
      it('coerces a string to a string', () => {
        const result = parsePropertyValue('hello world', MEMBER_FLAGS.String);
        expect(result).toBe('hello world');
      });

      it('coerces an empty string to a string', () => {
        const result = parsePropertyValue('', MEMBER_FLAGS.String);
        expect(result).toBe('');
      });

      it('coerces the string "false" to string "false"', () => {
        const result = parsePropertyValue('false', MEMBER_FLAGS.String);
        expect(result).toBe('false');
      });

      it('coerces the string "False" to string "False"', () => {
        const result = parsePropertyValue('False', MEMBER_FLAGS.String);
        expect(result).toBe('False');
      });

      it('coerces the string "true" to string "true"', () => {
        const result = parsePropertyValue('true', MEMBER_FLAGS.String);
        expect(result).toBe('true');
      });

      it('coerces the number 0 to string "0"', () => {
        const result = parsePropertyValue(0, MEMBER_FLAGS.String);
        expect(result).toBe('0');
      });

      it('coerces the string "0" to string "0"', () => {
        const result = parsePropertyValue('0', MEMBER_FLAGS.String);
        expect(result).toBe('0');
      });

      it('coerces the number 1 to string "1"', () => {
        const result = parsePropertyValue(1, MEMBER_FLAGS.String);
        expect(result).toBe('1');
      });

      it('coerces the string "1" to string "1"', () => {
        const result = parsePropertyValue('1', MEMBER_FLAGS.String);
        expect(result).toBe('1');
      });

      it('does not coerce null to string', () => {
        const result = parsePropertyValue(null, MEMBER_FLAGS.String);
        expect(result).toBe(null);
      });

      it('coerces the string "null" to string "null"', () => {
        const result = parsePropertyValue('null', MEMBER_FLAGS.String);
        expect(result).toBe('null');
      });

      it('does not coerce undefined to string', () => {
        const result = parsePropertyValue(undefined, MEMBER_FLAGS.String);
        expect(result).toBe(undefined);
      });

      it('coerces the string "undefined" to string "undefined"', () => {
        const result = parsePropertyValue('undefined', MEMBER_FLAGS.String);
        expect(result).toBe('undefined');
      });

      it('coerces NaN to string "NaN"', () => {
        const result = parsePropertyValue(NaN, MEMBER_FLAGS.String);
        expect(result).toBe('NaN');
      });

      it('coerces the string "NaN" to string "NaN"', () => {
        const result = parsePropertyValue('NaN', MEMBER_FLAGS.String);
        expect(result).toBe('NaN');
      });

      it('does not coerce a function to a string', () => {
        const noOpFunction = () => 'return a string';
        const result = parsePropertyValue(noOpFunction, MEMBER_FLAGS.String);
        expect(result).toBe(noOpFunction);
      });
    });

    describe('non-primitive MEMBER_FLAGS', () => {
      it('returns the prop value for MEMBER_FLAGS.Any', () => {
        const result = parsePropertyValue(23, MEMBER_FLAGS.Any);
        expect(result).toBe(23);
      });

      it('returns the prop value for MEMBER_FLAGS.Unknown', () => {
        const result = parsePropertyValue(23, MEMBER_FLAGS.Unknown);
        expect(result).toBe(23);
      });
    });
  });
});

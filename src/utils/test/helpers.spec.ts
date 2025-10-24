import { dashToPascalCase, escapeWithPattern, isDef, mergeIntoWith, toCamelCase, toDashCase } from '../helpers';

describe('util helpers', () => {
  describe('dashToPascalCase', () => {
    it('my-3d-component => My3dComponent', () => {
      expect(dashToPascalCase('my-3d-component')).toBe('My3dComponent');
    });

    it('madison-wisconsin => MadisonWisconsin', () => {
      expect(dashToPascalCase('madison-wisconsin')).toBe('MadisonWisconsin');
    });

    it('wisconsin => Wisconsin', () => {
      expect(dashToPascalCase('wisconsin')).toBe('Wisconsin');
    });
  });

  describe('toCamelCase', () => {
    it.each([
      ['my-3d-component', 'my3dComponent'],
      ['madison-wisconsin', 'madisonWisconsin'],
      ['wisconsin', 'wisconsin'],
    ])('%s => %s', (input: string, exp: string) => {
      expect(toCamelCase(input)).toBe(exp);
    });
  });

  describe('toDashCase', () => {
    it('My3dComponent => my-3d-component', () => {
      expect(toDashCase('My3dComponent')).toBe('my-3d-component');
    });

    it('MadisonWisconsin => madison-wisconsin', () => {
      expect(toDashCase('MadisonWisconsin')).toBe('madison-wisconsin');
    });

    it('madisonWisconsin => madison-wisconsin', () => {
      expect(toDashCase('madisonWisconsin')).toBe('madison-wisconsin');
    });

    it('Wisconsin => wisconsin', () => {
      expect(toDashCase('Wisconsin')).toBe('wisconsin');
    });

    it('wisconsin => wisconsin', () => {
      expect(toDashCase('wisconsin')).toBe('wisconsin');
    });
  });

  describe('isDef', () => {
    it('number', () => {
      expect(isDef(88)).toBe(true);
    });

    it('string', () => {
      expect(isDef('str')).toBe(true);
    });

    it('object', () => {
      expect(isDef({})).toBe(true);
    });

    it('array', () => {
      expect(isDef([])).toBe(true);
    });

    it('false', () => {
      expect(isDef(false)).toBe(true);
    });

    it('true', () => {
      expect(isDef(true)).toBe(true);
    });

    it('undefined', () => {
      expect(isDef(undefined)).toBe(false);
    });

    it('null', () => {
      expect(isDef(null)).toBe(false);
    });
  });

  describe('mergeIntoWith', () => {
    it('should do nothing if all elements already present', () => {
      const target = [1, 2, 3];
      mergeIntoWith(target, [1, 2, 3], (x) => x);
      expect(target).toEqual([1, 2, 3]);
    });

    it('should add new items', () => {
      const target = [1, 2, 3];
      mergeIntoWith(target, [1, 2, 3, 4, 5], (x) => x);
      expect(target).toEqual([1, 2, 3, 4, 5]);
    });

    it('should merge in objects using the predicate', () => {
      const target = [{ id: 'foo' }, { id: 'bar' }, { id: 'boz' }, { id: 'baz' }];
      mergeIntoWith(target, [{ id: 'foo' }, { id: 'fab' }, { id: 'fib' }], (x) => x.id);
      expect(target).toEqual([
        { id: 'foo' },
        { id: 'bar' },
        { id: 'boz' },
        { id: 'baz' },
        { id: 'fab' },
        { id: 'fib' },
      ]);
    });
  });

  describe('escapeWithPattern', () => {
    it('replaces all occurrences of a string pattern by default', () => {
      const text = 'foo/bar foo/bar foo/bar';
      const pattern = '/';
      const replacement = '\\/';
      expect(escapeWithPattern(text, pattern, replacement)).toBe('foo\\/bar foo\\/bar foo\\/bar');
    });

    it('replaces only first occurrence if replaceAll is false', () => {
      const text = 'foo/bar foo/bar foo/bar';
      const pattern = '/';
      const replacement = '\\/';
      expect(escapeWithPattern(text, pattern, replacement, false)).toBe('foo\\/bar foo/bar foo/bar');
    });

    it('replaces all occurrences using a RegExp pattern with no g flag by default', () => {
      const text = 'a+b+c+a+b+c';
      const pattern = /\+/; // no 'g' flag
      const replacement = '-';
      expect(escapeWithPattern(text, pattern, replacement)).toBe('a-b-c-a-b-c');
    });

    it('replaces only first occurrence if replaceAll is false with RegExp', () => {
      const text = 'a+b+c+a+b+c';
      const pattern = /\+/;
      const replacement = '-';
      expect(escapeWithPattern(text, pattern, replacement, false)).toBe('a-b+c+a+b+c');
    });

    it('respects the g flag if RegExp already has it and replaceAll true', () => {
      const text = 'x*y*z*x*y*z';
      const pattern = /\*/g;
      const replacement = '-';
      expect(escapeWithPattern(text, pattern, replacement, true)).toBe('x-y-z-x-y-z');
    });

    it('removes the g flag if replaceAll is false', () => {
      const text = 'x*y*z*x*y*z';
      const pattern = /\*/g;
      const replacement = '-';
      expect(escapeWithPattern(text, pattern, replacement, false)).toBe('x-y*z*x*y*z');
    });

    it('escapes special RegExp chars in string pattern', () => {
      const text = 'foo.*+?^${}()|[]\\bar';
      const pattern = '.*+?^${}()|[]\\';
      const replacement = '-ESCAPED-';
      expect(escapeWithPattern(text, pattern, replacement)).toBe('foo-ESCAPED-bar');
    });

    it('works with empty string input', () => {
      expect(escapeWithPattern('', 'a', 'b')).toBe('');
    });

    it('works with empty replacement', () => {
      expect(escapeWithPattern('abcabc', 'a', '')).toBe('bcbc');
    });
  });
});

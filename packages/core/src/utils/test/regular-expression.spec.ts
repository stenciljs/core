import { escapeRegExpSpecialCharacters } from '../regular-expression';

describe('regular expression utils', () => {
  describe('escapeRegExpSpecialCharacters', () => {
    it('should escape all special characters', () => {
      const text = 'This is a string with special characters: $ ^ * + ? . ( ) | { } [ ]';
      const expected = 'This is a string with special characters: \\$ \\^ \\* \\+ \\? \\. \\( \\) \\| \\{ \\} \\[ \\]';
      const result = escapeRegExpSpecialCharacters(text);
      expect(result).toEqual(expected);
    });

    it('should escape only special characters', () => {
      const text = 'This is a string without special characters';
      const expected = 'This is a string without special characters';
      const result = escapeRegExpSpecialCharacters(text);
      expect(result).toEqual(expected);
    });

    it('should ignore an empty string', () => {
      const text = '';
      const expected = '';
      const result = escapeRegExpSpecialCharacters(text);
      expect(result).toEqual(expected);
    });
  });
});

import { validateComponentTag } from '../validation';

describe('validation', () => {
  describe('validateComponentTag', () => {
    it('should error on non-string', () => {
      // @ts-ignore we're checking what happens when we pass an unexpected type (number instead of string)
      expect(validateComponentTag(3)).toBe('Tag "3" must be a string type');
    });

    it.each([' my-tag', 'my-tag ', ' my-tag '])('should error on whitespace', (tagName) => {
      expect(validateComponentTag(tagName)).toBe('Tag can not contain white spaces');
    });

    it('should error on upper case', () => {
      expect(validateComponentTag('My-Tag')).toBe('Tag can not contain upper case characters');
    });

    it('should error on empty string', () => {
      expect(validateComponentTag('')).toBe('Received empty tag value');
    });

    it('should error on inner whitespace', () => {
      expect(validateComponentTag('my- tag')).toBe('"my- tag" tag cannot contain a space');
    });

    it('should error on comma', () => {
      expect(validateComponentTag('my-tag,your-tag')).toBe('"my-tag,your-tag" tag cannot be used for multiple tags');
    });

    it.each(['你-好', 'my-@component', '!@#$!@#4-ohno'])('should error on any invalid characters', (funkyTag) => {
      expect(validateComponentTag(funkyTag)).toBe(
        `"${funkyTag}" tag contains invalid characters: ${funkyTag.replace(/\w|-/g, '')}`,
      );
    });

    it('should error if no dash', () => {
      expect(validateComponentTag('dashless')).toBe(
        '"dashless" tag must contain a dash (-) to work as a valid web component',
      );
    });

    it('should error on multiple dashes in a row', () => {
      expect(validateComponentTag('dash--crazy')).toBe(
        '"dash--crazy" tag cannot contain multiple dashes (--) next to each other',
      );
    });

    it('should error on leading dash', () => {
      expect(validateComponentTag('-dash')).toBe('"-dash" tag cannot start with a dash (-)');
    });

    it('should error on trailing dash', () => {
      expect(validateComponentTag('dash-')).toBe('"dash-" tag cannot end with a dash (-)');
    });

    it('should return undefined for valid tag names', () => {
      expect(validateComponentTag('my-component')).toBeUndefined();
    });
  });
});

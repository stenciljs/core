import { expect, describe, it } from '@stencil/vitest';

import { validateComponentModes, validateComponentTag } from '../validation';

describe('validation', () => {
  describe('validateComponentModes', () => {
    it('returns undefined when config.modes is not declared', () => {
      expect(validateComponentModes(undefined, { styleUrls: { typo: 'foo.css' } })).toBeUndefined();
    });

    it('returns undefined when config.modes is an empty array', () => {
      expect(validateComponentModes([], { styleUrls: { typo: 'foo.css' } })).toBeUndefined();
    });

    it('returns undefined when all used modes are allowed (string entries)', () => {
      expect(
        validateComponentModes(['ios', 'md'], {
          styleUrls: { ios: 'foo.ios.css', md: 'foo.md.css' },
        }),
      ).toBeUndefined();
    });

    it('returns undefined when styleUrls is the plain array form (no mode keys)', () => {
      expect(validateComponentModes(['ios', 'md'], { styleUrls: ['foo.css'] })).toBeUndefined();
    });

    it('errors on an unknown mode key in styleUrls', () => {
      expect(
        validateComponentModes(['ios', 'md'], {
          styleUrls: { ios: 'foo.ios.css', tyop: 'foo.tyop.css' },
        }),
      ).toEqual({
        propName: 'styleUrls',
        message: 'Invalid mode "tyop" in "styleUrls". Valid modes are: ios, md.',
      });
    });

    it('errors on an unknown mode key in styles', () => {
      expect(
        validateComponentModes(['ios', 'md'], {
          styles: { ios: ':host {}', tyop: ':host {}' },
        }),
      ).toEqual({
        propName: 'styles',
        message: 'Invalid mode "tyop" in "styles". Valid modes are: ios, md.',
      });
    });

    it('ignores the __identifier wrapper for a single imported style', () => {
      expect(
        validateComponentModes(['ios', 'md'], {
          styles: { __identifier: true, __escapedText: 'styles' } as any,
        }),
      ).toBeUndefined();
    });

    it('errors when a required mode is missing', () => {
      expect(
        validateComponentModes([{ mode: 'ios' }, { mode: 'md', required: true }], {
          styleUrls: { ios: 'foo.ios.css' },
        }),
      ).toEqual({
        propName: 'styleUrls',
        message: 'Missing required mode: md.',
      });
    });

    it('errors listing all missing required modes', () => {
      expect(
        validateComponentModes(
          [{ mode: 'ios', required: true }, { mode: 'md', required: true }, 'web'],
          { styleUrls: { web: 'foo.web.css' } },
        ),
      ).toEqual({
        propName: 'styleUrls',
        message: 'Missing required modes: ios, md.',
      });
    });

    it('does not require a mode when the component uses no mode-keyed styles at all', () => {
      expect(
        validateComponentModes([{ mode: 'ios', required: true }], { styleUrl: 'foo.css' } as any),
      ).toBeUndefined();
    });

    it('supports mixed string and object entries', () => {
      expect(
        validateComponentModes(['ios', { mode: 'md', required: true }], {
          styleUrls: { ios: 'foo.ios.css', md: 'foo.md.css' },
        }),
      ).toBeUndefined();
    });
  });

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
      expect(validateComponentTag('my-tag,your-tag')).toBe(
        '"my-tag,your-tag" tag cannot be used for multiple tags',
      );
    });

    it.each(['你-好', 'my-@component', '!@#$!@#4-ohno'])(
      'should error on any invalid characters',
      (funkyTag) => {
        expect(validateComponentTag(funkyTag)).toBe(
          `"${funkyTag}" tag contains invalid characters: ${funkyTag.replace(/\w|-/g, '')}`,
        );
      },
    );

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

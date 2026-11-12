import { convertJsdocLinksToMarkdown, convertJsdocTagsToMarkdown } from '../jsdoc-links';

describe('convertJsdocLinksToMarkdown', () => {
  it('returns unchanged text when there is no {@link} tag', () => {
    const text = 'Some documentation without any links.';
    expect(convertJsdocLinksToMarkdown(text)).toBe(text);
  });

  it('returns empty text as-is', () => {
    expect(convertJsdocLinksToMarkdown('')).toBe('');
  });

  it('converts `{@link url label}` into a markdown link', () => {
    expect(convertJsdocLinksToMarkdown('See {@link https://github.com GitHub} for details.')).toBe(
      'See [GitHub](https://github.com) for details.',
    );
  });

  it('converts `{@link url|label}` into a markdown link', () => {
    expect(convertJsdocLinksToMarkdown('See {@link https://github.com|GitHub} for details.')).toBe(
      'See [GitHub](https://github.com) for details.',
    );
  });

  it('converts a URL-only `{@link}` tag, using the URL as label', () => {
    expect(convertJsdocLinksToMarkdown('Docs: {@link https://stenciljs.com}')).toBe(
      'Docs: [https://stenciljs.com](https://stenciljs.com)',
    );
  });

  it('converts multiple URL links in one text', () => {
    expect(
      convertJsdocLinksToMarkdown('Check {@link https://github.com GitHub} and {@link https://stenciljs.com docs}.'),
    ).toBe('Check [GitHub](https://github.com) and [docs](https://stenciljs.com).');
  });

  it('leaves symbol links untouched', () => {
    const text = 'See {@link MyClass} and {@link MyClass#foo} and {@link MyClass#foo the foo property}.';
    expect(convertJsdocLinksToMarkdown(text)).toBe(text);
  });

  it('converts URL links but leaves symbol links untouched in mixed text', () => {
    expect(convertJsdocLinksToMarkdown('See {@link MyClass#foo} and {@link https://github.com GitHub}.')).toBe(
      'See {@link MyClass#foo} and [GitHub](https://github.com).',
    );
  });

  it('leaves malformed tags without a closing brace untouched', () => {
    const text = 'Broken {@link https://github.com GitHub';
    expect(convertJsdocLinksToMarkdown(text)).toBe(text);
  });
});

describe('convertJsdocTagsToMarkdown', () => {
  it('returns tags unchanged when no text contains a URL link', () => {
    const tags = [
      { name: 'deprecated', text: 'use something else instead' },
      { name: 'returns', text: 'the resolved value' },
    ];
    expect(convertJsdocTagsToMarkdown(tags)).toEqual(tags);
  });

  it('converts URL links in tag texts', () => {
    const tags = [{ name: 'deprecated', text: 'Use {@link https://stenciljs.com docs} instead.' }];
    expect(convertJsdocTagsToMarkdown(tags)).toEqual([
      { name: 'deprecated', text: 'Use [docs](https://stenciljs.com) instead.' },
    ]);
  });

  it('leaves symbol links in tag texts untouched', () => {
    const tags = [{ name: 'see', text: '{@link MyClass#foo} for details' }];
    expect(convertJsdocTagsToMarkdown(tags)).toEqual(tags);
  });
});

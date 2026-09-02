import { expect, describe, it } from '@stencil/vitest';

import { splitFontFaces } from '../inject-global-style';

describe('splitFontFaces', () => {
  it('returns the CSS unchanged when there is no @font-face', () => {
    expect(splitFontFaces('.codicon { color: red; }')).toEqual({
      fontFaceText: null,
      rest: '.codicon { color: red; }',
    });
  });

  it('splits a single @font-face out of surrounding rules', () => {
    const css = `@font-face { font-family: codicon; src: url("data:font/ttf;base64,AA=="); }\n.codicon { color: red; }`;
    const result = splitFontFaces(css);
    expect(result.fontFaceText).toBe(
      '@font-face { font-family: codicon; src: url("data:font/ttf;base64,AA=="); }',
    );
    expect(result.rest).toBe('\n.codicon { color: red; }');
  });

  it('joins multiple @font-face rules and strips them all', () => {
    const css =
      '@font-face { font-family: a; src: url(a.woff); }' +
      '@font-face { font-family: b; src: url(b.woff); }' +
      '.icon { color: red; }';
    const result = splitFontFaces(css);
    expect(result.fontFaceText).toBe(
      '@font-face { font-family: a; src: url(a.woff); }\n@font-face { font-family: b; src: url(b.woff); }',
    );
    expect(result.rest).toBe('.icon { color: red; }');
  });
});

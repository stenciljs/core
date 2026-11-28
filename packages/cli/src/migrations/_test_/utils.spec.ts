import { describe, it, expect } from 'vitest';

import { removeEmptyExtras } from '../utils';

describe('removeEmptyExtras', () => {
  it.each([
    ['between options', `{ a: 1, extras: {}, b: 2 }`, `{ a: 1, b: 2 }`],
    ['first', `{ extras: {}, b: 2 }`, `{ b: 2 }`],
    ['last', `{ a: 1, extras: {} }`, `{ a: 1 }`],
    ['last, with a trailing comma', `{ a: 1, extras: {}, }`, `{ a: 1 }`],
    ['the only option', `{ extras: {} }`, `{ }`],
    ['on several lines', `{\n  a: 1,\n  extras: {\n  },\n  b: 2,\n}`, `{\n  a: 1,\n  b: 2,\n}`],
    [
      'with CRLF line endings',
      `{\r\n  a: 1,\r\n  extras: {},\r\n  b: 2,\r\n}`,
      `{\r\n  a: 1,\r\n  b: 2,\r\n}`,
    ],
    [
      'after a comment',
      `{\n  a: 1, // note\n  extras: {},\n  b: 2,\n}`,
      `{\n  a: 1, // note\n  b: 2,\n}`,
    ],
  ])('removes extras: %s', (_, source, expected) => {
    expect(removeEmptyExtras(source)).toBe(expected);
  });

  it('keeps extras that has options', () => {
    const source = `{ a: 1, extras: { initializeNextTick: false }, b: 2 }`;
    expect(removeEmptyExtras(source)).toBe(source);
  });

  it('keeps other options ending in extras', () => {
    const source = `{ a: 1, myextras: {}, b: 2 }`;
    expect(removeEmptyExtras(source)).toBe(source);
  });
});

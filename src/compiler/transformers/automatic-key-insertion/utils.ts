import { createHash } from 'crypto';
import ts from 'typescript';

/**
 * An incrementing-number generator, just as a little extra 'uniqueness'
 * insurance for {@link deriveJSXKey}
 */
const incrementer = (function* () {
  let val = 0;
  while (true) {
    yield val++;
  }
})();

/**
 * Generate a unique key for a given JSX element. The key is creating by
 * concatenating and then hashing (w/ SHA1) the following:
 *
 * - an incrementing value
 * - the element's tag name
 * - the start position for the element's token in the original source file
 * - the end position for the element's token in the original source file
 *
 * It is hoped this provides enough uniqueness that a collision won't occur.
 *
 * @param jsxElement a typescript JSX syntax tree node which needs a key
 * @returns a computed unique key for that element
 */
export function deriveJSXKey(jsxElement: ts.JsxOpeningElement | ts.JsxSelfClosingElement): string {
  const hash = createHash('sha1')
    .update(`${incrementer.next().value}__${jsxElement.tagName}__${jsxElement.pos}_${jsxElement.end}`)
    .digest('hex')
    .toLowerCase();
  return hash;
}

/**
 * Removes an empty `extras` option from a Stencil config, along with the commas it no longer needs.
 *
 * @param text The source text to clean up
 * @returns The source text without the empty `extras` option
 */
export const removeEmptyExtras = (text: string): string =>
  text.replace(
    /(,?)\s*(?<![\w$])extras\s*:\s*\{\s*\}(\s*,(\s*\})?)?/g,
    // The comma before `extras` is still needed when another option follows
    (_match, leadingComma, trailingComma, closingBrace = '') =>
      (trailingComma && !closingBrace ? leadingComma : '') + closingBrace,
  );

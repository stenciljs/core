import type postcss from 'postcss';

/**
 * A JSDoc-style comment is `/** ... *\/` or `/*! ... *\/` - postcss's `Comment.text` already
 * strips the `/*`/`*\/` delimiters, so this checks the leading `*` or `!` that remains.
 * @param commentText a postcss `Comment` node's `.text`
 * @returns `true` if the comment is JSDoc-style
 */
export const isJsDocComment = (commentText: string): boolean =>
  commentText.startsWith('*') || commentText.startsWith('!');

/**
 * Strip the leading `*`/`!` marker and per-line `*` prefixes, returning trimmed lines.
 * @param commentText a postcss `Comment` node's `.text`
 * @returns the comment's lines, delimiters and leading `*`s stripped
 */
export const normalizeJsDocLines = (commentText: string): string[] => {
  const withoutMarker = commentText.replace(/^[*!]/, '');
  return withoutMarker
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\*/, '').trim())
    .filter((line, i, arr) => !(line === '' && (i === 0 || i === arr.length - 1)));
};

/**
 * @param commentText a postcss `Comment` node's `.text`
 * @returns the comment's lines joined into a single trimmed line of text
 */
export const normalizeJsDocText = (commentText: string): string =>
  normalizeJsDocLines(commentText).filter(Boolean).join(' ').trim();

/**
 * @param value a CSS descriptor value, possibly quoted (e.g. a `syntax` descriptor's `"<length>"`)
 * @returns the value with any surrounding quotes removed
 */
export const stripQuotes = (value: string): string => value.replace(/^['"]|['"]$/g, '');

export interface PropertyAtRuleDescriptors {
  /** From a native `@property` at-rule's `syntax` descriptor. */
  syntax?: string;
  /** From a native `@property` at-rule's `initial-value` descriptor. */
  initialValue?: string;
}

/**
 * Extract the `syntax`/`initial-value` descriptors from a native `@property` at-rule's body.
 * @param node a postcss `AtRule` node whose `name` is `property`
 * @returns the extracted descriptors, if present
 */
export const parsePropertyAtRuleDescriptors = (node: postcss.AtRule): PropertyAtRuleDescriptors => {
  let syntax: string | undefined;
  let initialValue: string | undefined;
  node.each((child) => {
    if (child.type !== 'decl') {
      return;
    }
    if (child.prop === 'syntax') {
      syntax = stripQuotes(child.value);
    } else if (child.prop === 'initial-value') {
      initialValue = child.value;
    }
  });
  return { syntax, initialValue };
};

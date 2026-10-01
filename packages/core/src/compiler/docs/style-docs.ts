import postcss from 'postcss';
import type * as d from '@stencil/core';

import {
  isJsDocComment,
  normalizeJsDocText,
  parsePropertyAtRuleDescriptors,
} from './css-doc-comments';

/**
 * Parse CSS docstrings that Stencil supports, as documented here:
 * https://stenciljs.com/docs/docs-json#css-variables
 *
 * Docstrings found in the supplied style text will be added to the `styleDocs` param, via three
 * mechanisms, in order of precedence (an earlier mechanism always wins over a later one for the
 * same custom property name):
 * 1. An explicit `@prop`/`@cssprop`/`@cssproperty` annotation in a block comment, anywhere in the file.
 * 2. A doc-commented `--foo: value;` declaration inside the component's "root" rule - `:host`
 *    for `shadow`/`scoped` encapsulation, or the component's own tag selector for `none`.
 * 3. A native `@property --foo { ... }` at-rule, with the `syntax`/`initial-value` descriptors
 *    surfaced as `syntax`/`default`. Not scoped - `@property` is a global registration.
 *
 * @param styleDocs the array to hold formatted CSS docstrings
 * @param styleText the CSS text we're working with
 * @param mode a mode associated with the parsed style, if applicable (e.g. this is not applicable for global styles)
 * @param tag the component's tag name, used to scope auto-detection for `none` encapsulation
 * @param encapsulation the component's encapsulation, used to pick the "root" scope for auto-detection
 */
export function parseStyleDocs(
  styleDocs: d.StyleDoc[],
  styleText: string | null,
  mode?: string | undefined,
  tag?: string,
  encapsulation?: string,
) {
  if (typeof styleText !== 'string') {
    return;
  }

  // Using `match` allows us to know which substring matched the regex and the starting
  // index at which the match was found
  let remainingText = styleText;
  let match = remainingText.match(CSS_DOC_START);
  while (match !== null) {
    remainingText = remainingText.substring(match.index + match[0].length);

    const endIndex = remainingText.indexOf(CSS_DOC_END);
    if (endIndex === -1) {
      break;
    }

    const comment = remainingText.substring(0, endIndex);
    parseCssComment(styleDocs, comment, mode);

    remainingText = remainingText.substring(endIndex + CSS_DOC_END.length);
    match = remainingText.match(CSS_DOC_START);
  }

  // Cheap guard - every custom property declaration and `@property` at-rule contains `--`,
  // so skip the postcss parse entirely for the common case of a file with neither.
  if (styleText.includes('--')) {
    parseScopedAndNativeStyleDocs(styleDocs, styleText, mode, tag, encapsulation);
  }
}

/**
 * Auto-detect doc-commented custom-property declarations within the component's "root" rule,
 * and native `@property` at-rule registrations, merging them into `styleDocs`. Mirrors the
 * equivalent detection for CSS-only components in `css-components/parse-css-component.ts`.
 *
 * @param styleDocs the array to hold formatted CSS docstrings - also consulted so an explicit
 * `@prop`/`@cssprop` annotation always wins over an auto-detected entry for the same name
 * @param styleText the CSS text we're working with
 * @param mode a mode associated with the parsed style, if applicable
 * @param tag the component's tag name
 * @param encapsulation the component's encapsulation
 */
function parseScopedAndNativeStyleDocs(
  styleDocs: d.StyleDoc[],
  styleText: string,
  mode: string | undefined,
  tag: string | undefined,
  encapsulation: string | undefined,
): void {
  let root: postcss.Root;
  try {
    root = postcss().process(styleText, { from: undefined }).root;
  } catch {
    // malformed/non-standard CSS (e.g. un-compiled Sass) - degrade gracefully, same as an
    // unclosed docstring comment does for the regex-based pass above.
    return;
  }

  const hasName = (name: string) => styleDocs.some((styleDoc) => styleDoc.name === name);

  const rootSelector = encapsulation === 'shadow' || encapsulation === 'scoped' ? ':host' : tag;

  if (rootSelector) {
    root.walkRules((rule) => {
      if (!rule.selectors.some((selector) => selector.trim() === rootSelector)) {
        return;
      }
      const children = rule.nodes;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== 'decl' || !child.prop.startsWith('--') || hasName(child.prop)) {
          continue;
        }
        const prev = children[i - 1];
        if (!prev || prev.type !== 'comment' || !isJsDocComment(prev.text)) {
          continue; // undocumented custom property - not collected
        }
        styleDocs.push({
          name: child.prop,
          docs: normalizeJsDocText(prev.text),
          annotation: 'prop',
          mode,
        });
      }
    });
  }

  root.walkAtRules('property', (node) => {
    const propName = node.params.trim();
    if (!propName.startsWith('--') || hasName(propName)) {
      return;
    }

    const { syntax, initialValue } = parsePropertyAtRuleDescriptors(node);
    const prev = node.prev();
    const docs =
      prev && prev.type === 'comment' && isJsDocComment(prev.text)
        ? normalizeJsDocText(prev.text)
        : '';

    styleDocs.push({
      name: propName,
      docs,
      annotation: 'prop',
      mode,
      ...(syntax && { syntax }),
      ...(initialValue && { default: initialValue }),
    });
  });
}

/**
 * Parse a CSS comment string and insert it into the provided array of
 * style docstrings.
 *
 * @param styleDocs an array which will be modified with the docstring
 * @param comment the comment string
 * @param mode a mode associated with the parsed style, if applicable (e.g. this is not applicable for global styles)
 */
function parseCssComment(styleDocs: d.StyleDoc[], comment: string, mode: string | undefined): void {
  // Example of what these comments might look like:
  // @property --max-width: Max width of the alert
  // (the above is an example of what these comments might look like)

  const lines = comment.split(/\r?\n/).map((line) => {
    line = line.trim();

    while (line.startsWith('*')) {
      line = line.substring(1).trim();
    }

    return line;
  });

  comment = lines.join(' ').replace(/\t/g, ' ').trim();

  while (comment.includes('  ')) {
    comment = comment.replace('  ', ' ');
  }

  const docs = comment.split(CSS_PROP_ANNOTATION_RE);

  docs.forEach((d) => {
    const cssDocument = d.trim();

    if (!cssDocument.startsWith(`--`)) {
      return;
    }

    const splt = cssDocument.split(`:`);
    const styleDoc: d.StyleDoc = {
      name: splt[0].trim(),
      docs: (splt.shift() && splt.join(`:`)).trim(),
      annotation: 'prop',
      mode,
    };

    if (!styleDocs.some((c) => c.name === styleDoc.name && c.annotation === 'prop')) {
      styleDocs.push(styleDoc);
    }
  });
}

/**
 * Opening syntax for a CSS docstring.
 * This will match a traditional docstring or a "loud" comment in sass
 */
const CSS_DOC_START = /\/\*(\*|!)/;
/**
 * Closing syntax for a CSS docstring
 */
const CSS_DOC_END = '*/';
/**
 * The `@prop` annotation we support within CSS docstrings. `@cssprop`/`@cssproperty` are also
 * recognized as synonyms (the more common names in other web-component-analyzer/docgen
 * ecosystems).
 */
const CSS_PROP_ANNOTATION_RE = /@(?:cssproperty|cssprop|prop)\b/;

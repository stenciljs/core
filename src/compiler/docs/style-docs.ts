import type * as d from '../../declarations';

/**
 * Parse CSS docstrings that Stencil supports, as documented here:
 * https://stenciljs.com/docs/docs-json#css-variables
 *
 * Docstrings found in the supplied style text will be added to the
 * `styleDocs` param
 *
 * @param styleDocs the array to hold formatted CSS docstrings
 * @param styleText the CSS text we're working with
 * @param mode a mode associated with the parsed style, if applicable (e.g. this is not applicable for global styles)
 */
export function parseStyleDocs(styleDocs: d.StyleDoc[], styleText: string | null, mode?: string | undefined) {
  if (typeof styleText !== 'string') {
    return;
  }

  // Using `match` allows us to know which substring matched the regex and the starting
  // index at which the match was found
  let match = styleText.match(CSS_DOC_START);
  while (match !== null) {
    styleText = styleText.substring(match.index + match[0].length);

    const endIndex = styleText.indexOf(CSS_DOC_END);
    if (endIndex === -1) {
      break;
    }

    const comment = styleText.substring(0, endIndex);
    parseCssComment(styleDocs, comment, mode);

    styleText = styleText.substring(endIndex + CSS_DOC_END.length);
    match = styleText.match(CSS_DOC_START);
  }
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
  /**
   * @prop --max-width: Max width of the alert
   */
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

  const docs = comment.split(CSS_PROP_ANNOTATION);

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
const CSS_DOC_START = /\/\*(\*|\!)/;
/**
 * Closing syntax for a CSS docstring
 */
const CSS_DOC_END = '*/';
/**
 * The `@prop` annotation we support within CSS docstrings
 */
const CSS_PROP_ANNOTATION = '@prop';

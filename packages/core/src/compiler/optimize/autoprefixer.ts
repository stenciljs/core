import browserslist from 'browserslist';
import { browserslistToTargets, transform } from 'lightningcss';
import type * as d from '@stencil/core';
import type { Targets } from 'lightningcss';

import type { PrintLine } from '../../declarations';

/**
 * Cache for resolved browserslist targets to avoid re-parsing for every stylesheet.
 * The key is a JSON-stringified version of the browser targets array.
 */
let cachedTargets: Targets | null = null;
let cachedTargetKey: string | null = null;

/**
 * Get Lightning CSS targets from browser targets, using a cache to avoid
 * repeatedly parsing the same browserslist query for every stylesheet.
 *
 * @param browserTargets array of browserslist query strings
 * @returns Lightning CSS targets object
 */
const getTargets = (browserTargets: string[]): Targets => {
  const key = JSON.stringify(browserTargets);
  if (cachedTargetKey === key && cachedTargets !== null) {
    return cachedTargets;
  }
  cachedTargets = browserslistToTargets(browserslist(browserTargets));
  cachedTargetKey = key;
  return cachedTargets;
};

/**
 * Autoprefix a CSS string, adding vendor prefixes to ensure that what is
 * written in the CSS will render correctly across our range of supported
 * browsers. Uses Lightning CSS to add vendor prefixes based on a browserslist
 * query.
 *
 * @param cssText the CSS text to be prefixed
 * @param opts options controlling which browsers to target, or `null` to use
 * the default browser targets
 * @param filePath optional file path for error reporting
 * @param minify whether to also minify the CSS (default: false)
 * @returns a Promise wrapping the prefixed CSS and any diagnostics
 */
export const autoprefixCss = async (
  cssText: string,
  opts: boolean | null | d.AutoprefixerOptions,
  filePath?: string,
  minify: boolean = false,
): Promise<d.OptimizeCssOutput> => {
  const output: d.OptimizeCssOutput = {
    output: cssText,
    diagnostics: [],
  };

  try {
    const browserTargets =
      opts != null &&
      typeof opts === 'object' &&
      Array.isArray((opts as d.AutoprefixerOptions).targets)
        ? (opts as d.AutoprefixerOptions).targets!
        : DEFAULT_BROWSER_TARGETS;

    const targets = getTargets(browserTargets);

    const result = transform({
      filename: filePath ?? 'style.css',
      code: Buffer.from(cssText),
      targets,
      minify,
    });

    output.output = result.code.toString();
  } catch (e: any) {
    const diagnostic: d.Diagnostic = {
      header: `CSS Error`,
      messageText: `CSS Error: ${e}`,
      level: `error`,
      type: `css`,
      lines: [],
    };

    if (typeof e.name === 'string') {
      diagnostic.header = e.name;
    }

    if (typeof e.message === 'string') {
      diagnostic.messageText = e.message;
    }

    // Extract file path from lightningcss error
    if (filePath) {
      diagnostic.absFilePath = filePath;
    } else if (typeof e.fileName === 'string' && e.fileName !== 'style.css') {
      diagnostic.absFilePath = e.fileName;
    }

    // Extract line/column info from lightningcss error
    if (e.loc && typeof e.loc.line === 'number') {
      diagnostic.lineNumber = e.loc.line;
      diagnostic.columnNumber = e.loc.column ?? 1;

      // Build PrintLine objects to show the problematic code in context
      const sourceText = typeof e.source === 'string' ? e.source : cssText;
      const lines = sourceText.split('\n');
      const errorLine = e.loc.line;
      const errorColumn = e.loc.column ?? 1;

      // Show 2 lines before and after for context
      const startLine = Math.max(1, errorLine - 2);
      const endLine = Math.min(lines.length, errorLine + 2);

      const printLines: PrintLine[] = [];
      for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
        const lineIndex = lineNum - 1;
        const lineText = lines[lineIndex] ?? '';
        printLines.push({
          lineIndex,
          lineNumber: lineNum,
          text: lineText,
          errorCharStart: lineNum === errorLine ? errorColumn - 1 : -1,
          errorLength: lineNum === errorLine ? Math.max(1, lineText.length - (errorColumn - 1)) : 0,
        });
      }
      diagnostic.lines = printLines;
    }

    output.diagnostics.push(diagnostic);
  }

  return output;
};

/**
 * Default browserslist targets used when autoprefixing CSS in v5.
 * Targets modern browsers — IE11, old Edge, and very old mobile browsers
 * are no longer included since Stencil v5 targets ES2017+ only.
 */
const DEFAULT_BROWSER_TARGETS: string[] = [
  'last 2 Chrome versions',
  'last 2 Firefox versions',
  'last 2 Safari versions',
  'last 2 Edge versions',
  'iOS >= 14',
  'Android >= 6',
  '> 0.5%',
  'not dead',
];

import browserslist from 'browserslist';
import { browserslistToTargets, transform } from 'lightningcss';
import type * as d from '@stencil/core';

/**
 * Autoprefix a CSS string, adding vendor prefixes to ensure that what is
 * written in the CSS will render correctly across our range of supported
 * browsers. Uses Lightning CSS to add vendor prefixes based on a browserslist
 * query.
 *
 * @param cssText the CSS text to be prefixed
 * @param opts options controlling which browsers to target, or `null` to use
 * the default browser targets
 * @returns a Promise wrapping the prefixed CSS and any diagnostics
 */
export const autoprefixCss = async (
  cssText: string,
  opts: boolean | null | d.AutoprefixerOptions,
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

    const targets = browserslistToTargets(browserslist(browserTargets));

    const result = transform({
      filename: 'style.css',
      code: Buffer.from(cssText),
      targets,
      minify: false,
    });

    output.output = result.code.toString();
  } catch (e: any) {
    const diagnostic: d.Diagnostic = {
      header: `Autoprefix CSS`,
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

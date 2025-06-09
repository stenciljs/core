import { Postcss } from 'postcss';

import type * as d from '../../declarations';

type CssProcessor = ReturnType<Postcss>;
let cssProcessor: CssProcessor;

/**
 * Autoprefix a CSS string, adding vendor prefixes to make sure that what
 * is written in the CSS will render correctly in our range of supported browsers.
 * This function uses PostCSS in combination with the Autoprefix plugin to
 * automatically add vendor prefixes based on a list of browsers which we want
 * to support.
 *
 * @param cssText the text to be prefixed
 * @param opts an optional param with options for Autoprefixer
 * @returns a Promise wrapping some prefixed CSS as well as diagnostics
 */
export const autoprefixCss = async (cssText: string, opts: boolean | null | d.AutoprefixerOptions) => {
  const output: d.OptimizeCssOutput = {
    output: cssText,
    diagnostics: [],
  };

  try {
    const autoprefixerOpts = opts != null && typeof opts === 'object' ? opts : DEFAULT_AUTOPREFIX_OPTIONS;

    const processor = getProcessor(autoprefixerOpts);
    const result = await processor.process(cssText, { map: null });

    result.warnings().forEach((warning: any) => {
      output.diagnostics.push({
        header: `Autoprefix CSS: ${warning.plugin}`,
        messageText: warning.text,
        level: 'warn',
        type: 'css',
        lines: [],
      });
    });

    output.output = result.css;
  } catch (e: any) {
    const diagnostic: d.Diagnostic = {
      header: `Autoprefix CSS`,
      messageText: `CSS Error` + e,
      level: `error`,
      type: `css`,
      lines: [],
    };

    if (typeof e.name === 'string') {
      diagnostic.header = e.name;
    }

    if (typeof e.reason === 'string') {
      diagnostic.messageText = e.reason;
    }

    if (typeof e.source === 'string' && typeof e.line === 'number') {
      const lines = (e.source as string).replace(/\r/g, '\n').split('\n');

      if (lines.length > 0) {
        const addLine = (lineNumber: number) => {
          const line = lines[lineNumber];
          if (typeof line === 'string') {
            const printLine: d.PrintLine = {
              lineIndex: -1,
              lineNumber: -1,
              text: line,
              errorCharStart: -1,
              errorLength: -1,
            };
            diagnostic.lines = diagnostic.lines || [];
            diagnostic.lines.push(printLine);
          }
        };

        addLine(e.line - 3);
        addLine(e.line - 2);
        addLine(e.line - 1);
        addLine(e.line);
        addLine(e.line + 1);
        addLine(e.line + 2);
        addLine(e.line + 3);
      }
    }

    output.diagnostics.push(diagnostic);
  }

  return output;
};

/**
 * Get the processor for PostCSS and the Autoprefixer plugin
 *
 * @param autoprefixerOpts Options for Autoprefixer
 * @returns postCSS with the Autoprefixer plugin applied
 */
const getProcessor = (autoprefixerOpts: d.AutoprefixerOptions): CssProcessor => {
  const { postcss, autoprefixer } = require('../sys/node/autoprefixer.js');
  if (!cssProcessor) {
    cssProcessor = postcss([autoprefixer(autoprefixerOpts)]);
  }
  return cssProcessor;
};

/**
 * Default options for the Autoprefixer PostCSS plugin. See the documentation:
 * https://github.com/postcss/autoprefixer#options for a complete list.
 *
 * This default option set will:
 *
 * - override the default browser list (`overrideBrowserslist`)
 * - turn off the visual cascade (`cascade`)
 * - disable auto-removing outdated prefixes (`remove`)
 * - set `flexbox` to `"no-2009"`, which limits prefixing for flexbox to the
 *   final and IE 10 versions of the specification
 */
const DEFAULT_AUTOPREFIX_OPTIONS: d.AutoprefixerOptions = {
  overrideBrowserslist: ['last 2 versions', 'iOS >= 9', 'Android >= 4.4', 'Explorer >= 11', 'ExplorerMobile >= 11'],
  cascade: false,
  remove: false,
  flexbox: 'no-2009',
};

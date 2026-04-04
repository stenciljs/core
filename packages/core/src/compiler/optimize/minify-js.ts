import { minify, JsMinifyOptions } from '@swc/core';
import type * as d from '@stencil/core';

import { splitLineBreaks } from '../../utils';

/**
 * Performs the minification of JavaScript source using SWC
 * @param input the JavaScript source to minify
 * @param opts the options used by the minifier
 * @returns the resulting minified JavaScript
 */
export const minifyJs = async (
  input: string,
  opts?: JsMinifyOptions,
): Promise<d.OptimizeJsResult> => {
  const results: d.OptimizeJsResult = {
    output: input,
    sourceMap: null,
    diagnostics: [],
  };

  // if (!opts) {
  //   return results;
  // }

  try {
    const minifyResults = await minify(input, opts);

    results.output = minifyResults.code;
    if (minifyResults.map) {
      results.sourceMap =
        typeof minifyResults.map === 'string' ? JSON.parse(minifyResults.map) : minifyResults.map;
    }
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.stack);
    }
    loadMinifyJsDiagnostics(input, results.diagnostics, e);
  }

  return results;
};

const loadMinifyJsDiagnostics = (sourceText: string, diagnostics: d.Diagnostic[], error: any) => {
  const diagnostic: d.Diagnostic = {
    level: 'error',
    type: 'build',
    language: 'javascript',
    header: 'Minify JS',
    code: '',
    messageText: error.message,
    absFilePath: undefined,
    relFilePath: undefined,
    lines: [],
  };

  const err: {
    col: number;
    filename: string;
    line: number;
    message: string;
    name: string;
    pos: number;
    stack: string;
  } = error;

  if (typeof err.line === 'number' && err.line > -1) {
    const srcLines = splitLineBreaks(sourceText);

    const errorLine: d.PrintLine = {
      lineIndex: err.line - 1,
      lineNumber: err.line,
      text: srcLines[err.line - 1],
      errorCharStart: err.col,
      errorLength: 0,
    };

    diagnostic.lineNumber = errorLine.lineNumber;
    diagnostic.columnNumber = errorLine.errorCharStart;

    const highlightLine = errorLine.text.slice(diagnostic.columnNumber);
    for (let i = 0; i < highlightLine.length; i++) {
      if (MINIFY_CHAR_BREAK.has(highlightLine.charAt(i))) {
        break;
      }
      errorLine.errorLength++;
    }

    diagnostic.lines.push(errorLine);

    if (errorLine.errorLength === 0 && errorLine.errorCharStart > 0) {
      errorLine.errorLength = 1;
      errorLine.errorCharStart--;
    }

    if (errorLine.lineIndex > 0) {
      const previousLine: d.PrintLine = {
        lineIndex: errorLine.lineIndex - 1,
        lineNumber: errorLine.lineNumber - 1,
        text: srcLines[errorLine.lineIndex - 1],
        errorCharStart: -1,
        errorLength: -1,
      };

      diagnostic.lines.unshift(previousLine);
    }

    if (errorLine.lineIndex + 1 < srcLines.length) {
      const nextLine: d.PrintLine = {
        lineIndex: errorLine.lineIndex + 1,
        lineNumber: errorLine.lineNumber + 1,
        text: srcLines[errorLine.lineIndex + 1],
        errorCharStart: -1,
        errorLength: -1,
      };

      diagnostic.lines.push(nextLine);
    }
  }

  diagnostics.push(diagnostic);
};

const MINIFY_CHAR_BREAK = new Set([
  ' ',
  '=',
  '.',
  ',',
  '?',
  ':',
  ';',
  '(',
  ')',
  '{',
  '}',
  '[',
  ']',
  '|',
  `'`,
  `"`,
  '`',
]);

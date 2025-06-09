import type * as d from '../../declarations';

/**
 * Iterate through a series of diagnostics to provide minor fix-ups for various edge cases, deduplicate messages, etc.
 * @param compilerCtx the current compiler context
 * @param diagnostics the diagnostics to normalize
 * @returns the normalize documents
 */
export const normalizeDiagnostics = (compilerCtx: d.CompilerCtx, diagnostics: d.Diagnostic[]): d.Diagnostic[] => {
  const maxErrorsToNormalize = 25;
  const normalizedErrors: d.Diagnostic[] = [];
  const normalizedOthers: d.Diagnostic[] = [];
  const dups = new Set<string>();

  for (let i = 0; i < diagnostics.length; i++) {
    const diagnostic = normalizeDiagnostic(compilerCtx, diagnostics[i]);

    const key = (diagnostic.absFilePath ?? '') + (diagnostic.code ?? '') + diagnostic.messageText + diagnostic.type;
    if (dups.has(key)) {
      continue;
    }
    dups.add(key);

    const total = normalizedErrors.length + normalizedOthers.length;
    if (diagnostic.level === 'error') {
      normalizedErrors.push(diagnostic);
    } else if (total < maxErrorsToNormalize) {
      normalizedOthers.push(diagnostic);
    }
  }

  return [...normalizedErrors, ...normalizedOthers];
};

/**
 * Perform post-processing on a `Diagnostic` to handle a few message edge cases, massaging error message text and
 * updating build failure contexts
 * @param compilerCtx the current compiler
 * @param diagnostic the diagnostic to normalize
 * @returns the altered diagnostic
 */
const normalizeDiagnostic = (compilerCtx: d.CompilerCtx, diagnostic: d.Diagnostic): d.Diagnostic => {
  if (diagnostic.messageText) {
    if (typeof (<any>diagnostic.messageText).message === 'string') {
      diagnostic.messageText = (<any>diagnostic.messageText).message;
    } else if (typeof diagnostic.messageText === 'string' && diagnostic.messageText.indexOf('Error: ') === 0) {
      diagnostic.messageText = diagnostic.messageText.slice(7);
    }
  }

  if (diagnostic.messageText) {
    if (diagnostic.messageText.includes(`Cannot find name 'h'`)) {
      diagnostic.header = `Missing "h" import for JSX types`;
      diagnostic.messageText = `In order to load accurate JSX types for components, the "h" function must be imported from "@stencil/core" by each component using JSX. For example: import { Component, h } from '@stencil/core';`;

      if (diagnostic.absFilePath) {
        try {
          const sourceText = compilerCtx.fs.readFileSync(diagnostic.absFilePath);
          const srcLines = splitLineBreaks(sourceText);
          for (let i = 0; i < srcLines.length; i++) {
            const srcLine = srcLines[i];
            if (srcLine.includes('@stencil/core')) {
              const msgLines: d.PrintLine[] = [];

              const beforeLineIndex = i - 1;
              if (beforeLineIndex > -1) {
                const beforeLine: d.PrintLine = {
                  lineIndex: beforeLineIndex,
                  lineNumber: beforeLineIndex + 1,
                  text: srcLines[beforeLineIndex],
                  errorCharStart: -1,
                  errorLength: -1,
                };
                msgLines.push(beforeLine);
              }

              const errorLine: d.PrintLine = {
                lineIndex: i,
                lineNumber: i + 1,
                text: srcLine,
                errorCharStart: 0,
                errorLength: -1,
              };
              msgLines.push(errorLine);
              diagnostic.lineNumber = errorLine.lineNumber;
              diagnostic.columnNumber = srcLine.indexOf('}');

              const afterLineIndex = i + 1;
              if (afterLineIndex < srcLines.length) {
                const afterLine: d.PrintLine = {
                  lineIndex: afterLineIndex,
                  lineNumber: afterLineIndex + 1,
                  text: srcLines[afterLineIndex],
                  errorCharStart: -1,
                  errorLength: -1,
                };
                msgLines.push(afterLine);
              }

              diagnostic.lines = msgLines;
              break;
            }
          }
        } catch (e) {}
      }
    }
  }

  return diagnostic;
};

/**
 * Split a corpus by newlines. Carriage returns are treated a newlines.
 * @param sourceText the corpus to split
 * @returns the split text
 */
export const splitLineBreaks = (sourceText: string): ReadonlyArray<string> => {
  if (typeof sourceText !== 'string') return [];
  sourceText = sourceText.replace(/\\r/g, '\n');
  return sourceText.split('\n');
};

export const escapeHtml = (unsafe: any) => {
  if (unsafe === undefined) return 'undefined';
  if (unsafe === null) return 'null';

  if (typeof unsafe !== 'string') {
    unsafe = unsafe.toString();
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

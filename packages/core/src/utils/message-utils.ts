import type * as d from '@stencil/core';

import { isString } from './helpers';

/**
 * Builds a template `Diagnostic` entity for a build error. The created `Diagnostic` is returned, and have little
 * detail attached to it regarding the specifics of the error - it is the responsibility of the caller of this method
 * to attach the specifics of the error message.
 *
 * The created `Diagnostic` is pushed to the `diagnostics` argument as a side effect of calling this method.
 *
 * @param diagnostics the existing diagnostics that the created template `Diagnostic` should be added to
 * @returns the created `Diagnostic`
 */
export const buildError = (diagnostics?: d.Diagnostic[]): d.Diagnostic => {
  const diagnostic: d.Diagnostic = {
    level: 'error',
    type: 'build',
    header: 'Build Error',
    messageText: 'build error',
    relFilePath: undefined,
    absFilePath: undefined,
    lines: [],
  };

  if (diagnostics) {
    diagnostics.push(diagnostic);
  }

  return diagnostic;
};

/**
 * Builds a template `Diagnostic` entity for a build warning. The created `Diagnostic` is returned, and have little
 * detail attached to it regarding the specifics of the warning - it is the responsibility of the caller of this method
 * to attach the specifics of the warning message.
 *
 * The created `Diagnostic` is pushed to the `diagnostics` argument as a side effect of calling this method.
 *
 * @param diagnostics the existing diagnostics that the created template `Diagnostic` should be added to
 * @returns the created `Diagnostic`
 */
export const buildWarn = (diagnostics: d.Diagnostic[]): d.Diagnostic => {
  const diagnostic: d.Diagnostic = {
    level: 'warn',
    type: 'build',
    header: 'Build Warn',
    messageText: 'build warn',
    lines: [],
  };

  diagnostics.push(diagnostic);

  return diagnostic;
};

/**
 * Create a diagnostic message suited for representing an error in a JSON
 * file. This includes information about the exact lines in the JSON file which
 * caused the error and the path to the file.
 *
 * @param compilerCtx the current compiler context
 * @param diagnostics a list of diagnostics used as a return param
 * @param jsonFilePath the path to the JSON file where the error occurred
 * @param msg the error message
 * @param jsonField the key for the field which caused the error, used for finding
 * the error line in the original JSON file. Only root-level keys (with minimal
 * indentation, typically 2 spaces) are highlighted to avoid matching nested keys.
 * @returns a reference to the newly-created diagnostic
 */
export const buildJsonFileError = (
  compilerCtx: d.CompilerCtx,
  diagnostics: d.Diagnostic[],
  jsonFilePath: string,
  msg: string,
  jsonField: string,
) => {
  const err = buildError(diagnostics);
  err.messageText = msg;
  err.absFilePath = jsonFilePath;

  if (typeof jsonField === 'string') {
    try {
      const jsonStr = compilerCtx.fs.readFileSync(jsonFilePath);
      const lines = jsonStr.replace(/\r/g, '\n').split('\n');

      // Find matches that appear to be root-level JSON keys.
      // In a standard pretty-printed JSON file, root-level keys have 2 spaces of indentation.
      // We only highlight if we find a match at root level to avoid highlighting nested keys
      // (e.g., highlighting "type": "git" inside repository when looking for the root "type" field).
      let bestMatch: { lineIndex: number; charIndex: number; indentation: number } | null = null;
      const ROOT_LEVEL_INDENTATION = 2;

      for (let i = 0; i < lines.length; i++) {
        const txtLine = lines[i];
        const txtIndex = txtLine.indexOf(jsonField);

        if (txtIndex > -1) {
          // Calculate indentation (number of leading whitespace chars)
          const indentation = txtLine.search(/\S/);

          // For package.json and similar files, root-level keys are at 2 spaces indentation.
          // Only consider this a match if it's at root level, or if no root match was found
          // and this is the least-indented option.
          if (indentation === ROOT_LEVEL_INDENTATION) {
            // Found a root-level match - use it
            bestMatch = { lineIndex: i, charIndex: txtIndex, indentation };
            break; // Root level found, no need to continue
          } else if (bestMatch === null || indentation < bestMatch.indentation) {
            // Track this as a fallback in case no root-level match exists
            bestMatch = { lineIndex: i, charIndex: txtIndex, indentation };
          }
        }
      }

      // Only show line context if we found a root-level match (indentation === 2)
      // This avoids highlighting nested keys when the root key doesn't exist
      if (bestMatch !== null && bestMatch.indentation === ROOT_LEVEL_INDENTATION) {
        const i = bestMatch.lineIndex;
        const txtIndex = bestMatch.charIndex;
        const txtLine = lines[i];

        const warnLine: d.PrintLine = {
          lineIndex: i,
          lineNumber: i + 1,
          text: txtLine,
          errorCharStart: txtIndex,
          errorLength: jsonField.length,
        };
        err.lineNumber = warnLine.lineNumber;
        err.columnNumber = txtIndex + 1;
        err.lines.push(warnLine);

        if (i > 0) {
          const beforeWarnLine: d.PrintLine = {
            lineIndex: warnLine.lineIndex - 1,
            lineNumber: warnLine.lineNumber - 1,
            text: lines[i - 1],
            errorCharStart: -1,
            errorLength: -1,
          };
          err.lines.unshift(beforeWarnLine);
        }

        if (i < lines.length - 1) {
          const afterWarnLine: d.PrintLine = {
            lineIndex: warnLine.lineIndex + 1,
            lineNumber: warnLine.lineNumber + 1,
            text: lines[i + 1],
            errorCharStart: -1,
            errorLength: -1,
          };
          err.lines.push(afterWarnLine);
        }
      }
    } catch {}
  }

  return err;
};

/**
 * Builds a diagnostic from an `Error`, appends it to the `diagnostics` parameter, and returns the created diagnostic
 * @param diagnostics the series of diagnostics the newly created diagnostics should be added to
 * @param err the error to derive information from in generating the diagnostic
 * @param msg an optional message to use in place of `err` to generate the diagnostic
 * @returns the generated diagnostic
 */
export const catchError = (
  diagnostics: d.Diagnostic[],
  err: Error | null | undefined,
  msg?: string,
): d.Diagnostic => {
  const diagnostic: d.Diagnostic = {
    level: 'error',
    type: 'build',
    header: 'Build Error',
    messageText: 'build error',
    lines: [],
  };

  if (isString(msg)) {
    diagnostic.messageText = msg.length ? msg : 'UNKNOWN ERROR';
  } else if (err != null) {
    if (err.stack != null) {
      diagnostic.messageText = err.stack.toString();
    } else {
      if (err.message != null) {
        diagnostic.messageText = err.message.length ? err.message : 'UNKNOWN ERROR';
      } else {
        diagnostic.messageText = err.toString();
      }
    }
  }

  if (diagnostics != null && !shouldIgnoreError(diagnostic.messageText)) {
    diagnostics.push(diagnostic);
  }

  return diagnostic;
};

/**
 * Determine if the provided diagnostics have any build errors
 * @param diagnostics the diagnostics to inspect
 * @returns true if any of the diagnostics in the list provided are errors that did not occur at runtime. false
 * otherwise.
 */
export const hasError = (diagnostics: d.Diagnostic[]): boolean => {
  if (diagnostics == null || diagnostics.length === 0) {
    return false;
  }
  return diagnostics.some((d) => d.level === 'error' && d.type !== 'runtime');
};

/**
 * Determine if the provided diagnostics have any warnings
 * @param diagnostics the diagnostics to inspect
 * @returns true if any of the diagnostics in the list provided are warnings. false otherwise.
 */
export const hasWarning = (diagnostics: d.Diagnostic[]): boolean => {
  if (diagnostics == null || diagnostics.length === 0) {
    return false;
  }
  return diagnostics.some((d) => d.level === 'warn');
};

export const shouldIgnoreError = (msg: any) => {
  return msg === TASK_CANCELED_MSG;
};

export const TASK_CANCELED_MSG = `task canceled`;

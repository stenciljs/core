import type { RollupError } from 'rollup';

import type * as d from '../../declarations';
import { isString, toTitleCase } from '../helpers';
import { buildWarn } from '../message-utils';
import { splitLineBreaks } from './logger-utils';

export const loadRollupDiagnostics = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  rollupError: RollupError,
) => {
  const formattedCode = formatErrorCode(rollupError.code);

  const diagnostic: d.Diagnostic = {
    level: 'error',
    type: 'bundling',
    language: 'javascript',
    code: rollupError.code,
    header: `Rollup${formattedCode.length > 0 ? ': ' + formattedCode : ''}`,
    messageText: formattedCode,
    relFilePath: undefined,
    absFilePath: undefined,
    lines: [],
  };

  if (config.logLevel === 'debug' && rollupError.stack) {
    diagnostic.messageText = rollupError.stack;
  } else if (rollupError.message) {
    diagnostic.messageText = rollupError.message;
  }

  if (rollupError.plugin) {
    diagnostic.messageText += ` (plugin: ${rollupError.plugin}${rollupError.hook ? `, ${rollupError.hook}` : ''})`;
  }

  const loc = rollupError.loc;
  if (loc != null) {
    const srcFile = loc.file || rollupError.id;
    if (isString(srcFile)) {
      try {
        const sourceText = compilerCtx.fs.readFileSync(srcFile);
        if (sourceText) {
          diagnostic.absFilePath = srcFile;

          try {
            const srcLines = splitLineBreaks(sourceText);

            const errorLine = {
              lineIndex: loc.line - 1,
              lineNumber: loc.line,
              text: srcLines[loc.line - 1],
              errorCharStart: loc.column,
              errorLength: 0,
            } satisfies d.PrintLine;

            diagnostic.lineNumber = errorLine.lineNumber;
            diagnostic.columnNumber = errorLine.errorCharStart;

            const highlightLine = errorLine.text?.slice(loc.column) ?? '';
            for (let i = 0; i < highlightLine.length; i++) {
              if (charBreak.has(highlightLine.charAt(i))) {
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
          } catch (e) {
            diagnostic.messageText += `\nError parsing: ${diagnostic.absFilePath}, line: ${loc.line}, column: ${loc.column}`;
            diagnostic.debugText = sourceText;
          }
        } else if (typeof rollupError.frame === 'string') {
          diagnostic.messageText += '\n' + rollupError.frame;
        }
      } catch (e) {}
    }
  }

  buildCtx.diagnostics.push(diagnostic);
};

export const createOnWarnFn = (diagnostics: d.Diagnostic[], bundleModulesFiles?: d.Module[]) => {
  const previousWarns = new Set<string>();

  return function onWarningMessage(warning: { code?: string; importer?: string; message?: string }) {
    if (
      warning == null ||
      (warning.code && ignoreWarnCodes.has(warning.code)) ||
      (warning.message && previousWarns.has(warning.message))
    ) {
      return;
    }

    if (warning.message) {
      previousWarns.add(warning.message);
    }

    let label = '';
    if (bundleModulesFiles) {
      label = bundleModulesFiles
        .reduce((cmps, m) => {
          cmps.push(...m.cmps);
          return cmps;
        }, [] as d.ComponentCompilerMeta[])
        .join(', ')
        .trim();

      if (label.length) {
        label += ': ';
      }
    }

    const diagnostic = buildWarn(diagnostics);
    diagnostic.header = `Bundling Warning ${warning.code}`;
    diagnostic.messageText = label + (warning.message || warning);
  };
};

const ignoreWarnCodes = new Set([
  'THIS_IS_UNDEFINED',
  'NON_EXISTENT_EXPORT',
  'CIRCULAR_DEPENDENCY',
  'EMPTY_BUNDLE',
  'UNUSED_EXTERNAL_IMPORT',
]);

const charBreak = new Set([' ', '=', '.', ',', '?', ':', ';', '(', ')', '{', '}', '[', ']', '|', `'`, `"`, '`']);

const formatErrorCode = (errorCode: any) => {
  if (typeof errorCode === 'string') {
    return errorCode
      .split('_')
      .map((c) => {
        return toTitleCase(c.toLowerCase());
      })
      .join(' ');
  }
  return (errorCode || '').trim();
};

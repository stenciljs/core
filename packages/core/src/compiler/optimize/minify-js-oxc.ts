import { minifySync, type MinifyOptions } from 'rolldown/utils';
import type * as d from '@stencil/core';

/**
 * Performs the minification of JavaScript source using oxc
 * @param input the JavaScript source to minify
 * @param opts the options used by the minifier
 * @returns the resulting minified JavaScript
 */
export const minifyJsOxc = async (
  input: string,
  opts?: MinifyOptions,
): Promise<d.OptimizeJsResult> => {
  const results: d.OptimizeJsResult = {
    output: input,
    sourceMap: null,
    diagnostics: [],
  };

  try {
    const minifyResult = minifySync('module.js', input, opts);

    if (minifyResult.errors.length > 0) {
      loadMinifyJsOxcDiagnostics(results.diagnostics, minifyResult.errors);
      return results;
    }

    results.output = minifyResult.code;
    results.sourceMap = minifyResult.map
      ? {
          file: minifyResult.map.file ?? 'module.js',
          mappings: minifyResult.map.mappings,
          names: minifyResult.map.names,
          sourceRoot: minifyResult.map.sourceRoot,
          sources: minifyResult.map.sources,
          sourcesContent: minifyResult.map.sourcesContent,
          version: minifyResult.map.version,
        }
      : null;
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.stack);
    }
    loadMinifyJsOxcDiagnostics(results.diagnostics, [{ message: String(e), codeframe: null }]);
  }

  return results;
};

const loadMinifyJsOxcDiagnostics = (
  diagnostics: d.Diagnostic[],
  errors: { message: string; codeframe: string | null }[],
) => {
  for (const error of errors) {
    diagnostics.push({
      level: 'error',
      type: 'build',
      language: 'javascript',
      header: 'Minify JS (oxc)',
      code: '',
      messageText: error.codeframe ?? error.message,
      absFilePath: undefined,
      relFilePath: undefined,
      lines: [],
    });
  }
};

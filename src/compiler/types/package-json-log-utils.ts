import { buildJsonFileError } from '@utils';

import type * as d from '../../declarations';

/**
 * Build a diagnostic for an error resulting from a particular field in a
 * package.json file
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param msg an error string
 * @param jsonField the key for the field which caused the error, used for
 * finding the error line in the original JSON file
 * @returns a diagnostic object
 */
export const packageJsonError = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  msg: string,
  jsonField: string,
): d.Diagnostic => {
  const err = buildJsonFileError(compilerCtx, buildCtx.diagnostics, config.packageJsonFilePath, msg, jsonField);
  err.header = `Package Json`;
  return err;
};

/**
 * Build a diagnostic for a warning resulting from a particular field in a
 * package.json file
 *
 * @param config the stencil config
 * @param compilerCtx the current compiler context
 * @param buildCtx the current build context
 * @param msg an error string
 * @param jsonField the key for the field which caused the error, used for
 * finding the error line in the original JSON file
 * @returns a diagnostic object
 */
export const packageJsonWarn = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  msg: string,
  jsonField: string,
): d.Diagnostic => {
  const warn = buildJsonFileError(compilerCtx, buildCtx.diagnostics, config.packageJsonFilePath, msg, jsonField);
  warn.header = `Package Json`;
  warn.level = 'warn';
  return warn;
};

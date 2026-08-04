import { basename } from 'node:path';
import type * as d from '@stencil/core';

import { isBoolean, isOutputTargetGlobalStyle, isString } from '../../../utils';
import { getAbsolutePath } from '../config-utils';

/**
 * Validate and return global-style output targets.
 *
 * The global-style output generates a CSS file from an input stylesheet.
 * Can use either:
 * - Explicit `input` on the output target
 * - Implicit `globalStyle` from config (for backwards compat)
 *
 * Multiple global-style outputs are supported for building separate CSS bundles.
 *
 * @param config a validated configuration object
 * @param userOutputs an array of output targets
 * @returns an array of validated global-style output targets
 */
export const validateGlobalStyle = (
  config: d.ValidatedConfig,
  userOutputs: d.OutputTarget[],
): d.OutputTargetGlobalStyle[] => {
  return userOutputs.filter(isOutputTargetGlobalStyle).map((outputTarget) => {
    // Resolve input path - explicit input takes precedence over globalStyle config
    const input = isString(outputTarget.input)
      ? getAbsolutePath(config, outputTarget.input)
      : (config.globalStyle ?? undefined);

    // Determine output filename
    // Priority: explicit fileName > basename of input > {namespace}.css
    let fileName: string;
    if (isString(outputTarget.fileName)) {
      fileName = outputTarget.fileName;
    } else if (input) {
      // Use input basename, but only if it's from explicit input (not globalStyle)
      // For globalStyle compat, always use {namespace}.css
      if (isString(outputTarget.input)) {
        fileName = basename(input);
      } else {
        fileName = `${config.fsNamespace}.css`;
      }
    } else {
      fileName = `${config.fsNamespace}.css`;
    }

    // Validate inject option - must be 'none', 'client', or 'all'
    // Default depends on how the output target was configured:
    // - Auto-generated from globalStyle config (no explicit input) → 'client' (preserves v4 behavior)
    // - Explicitly configured with input → 'none' (new v5 default for explicit configs)
    const validInjectValues = ['none', 'client', 'all'] as const;
    const isUsingGlobalStyleConfig = !isString(outputTarget.input) && !!config.globalStyle;
    const defaultInject = isUsingGlobalStyleConfig ? 'client' : 'none';
    const inject = validInjectValues.includes(
      outputTarget.inject as (typeof validInjectValues)[number],
    )
      ? (outputTarget.inject as 'none' | 'client' | 'all')
      : defaultInject;

    return {
      ...outputTarget,
      input,
      fileName,
      dir: getAbsolutePath(config, outputTarget.dir ?? 'dist/assets'),
      copyToLoaderBrowser: isBoolean(outputTarget.copyToLoaderBrowser)
        ? outputTarget.copyToLoaderBrowser
        : true,
      skipInDev: isBoolean(outputTarget.skipInDev) ? outputTarget.skipInDev : false,
      inject,
    };
  });
};

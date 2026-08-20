import type * as d from '@stencil/core';

import { getGlobalScriptData } from '../../bundle/app-data-plugin';
import { HYDRATE_APP_CLOSURE_START } from './ssr-factory-closure';

/**
 * Relocates the SSR context constant declaration to be within the closure of the SSR app factory function.
 * Necessary because the SSR context relies on global scripts,
 * and global scripts must be executed before the SSR app factory function.
 *
 * @param config The validated Stencil configuration.
 * @param compilerCtx The compiler context.
 * @param code The code string to modify.
 * @returns The modified code string.
 */
export const relocateSsrContextConst = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  code: string,
) => {
  const globalScripts = getGlobalScriptData(config, compilerCtx);
  if (globalScripts.length > 0) {
    const startCode = code.indexOf('/*hydrate context start*/');
    if (startCode > -1) {
      const endCode = code.indexOf('/*hydrate context end*/') + '/*hydrate context end*/'.length;
      const hydrateContextCode = code.substring(startCode, endCode);
      code = code.replace(hydrateContextCode, '');
      return code.replace(
        HYDRATE_APP_CLOSURE_START,
        HYDRATE_APP_CLOSURE_START + '\n  ' + hydrateContextCode,
      );
    }
  }
  return code;
};

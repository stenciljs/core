import type * as d from '../../../declarations';
import { getGlobalScriptData } from '../../bundle/app-data-plugin';
import { HYDRATE_APP_CLOSURE_START } from './hydrate-factory-closure';

export const relocateHydrateContextConst = (config: d.ValidatedConfig, compilerCtx: d.CompilerCtx, code: string) => {
  const globalScripts = getGlobalScriptData(config, compilerCtx);
  if (globalScripts.length > 0) {
    const startCode = code.indexOf('/*hydrate context start*/');
    if (startCode > -1) {
      const endCode = code.indexOf('/*hydrate context end*/') + '/*hydrate context end*/'.length;
      const hydrateContextCode = code.substring(startCode, endCode);
      code = code.replace(hydrateContextCode, '');
      return code.replace(HYDRATE_APP_CLOSURE_START, HYDRATE_APP_CLOSURE_START + '\n  ' + hydrateContextCode);
    }
  }
  return code;
};
